import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { z } from 'zod';
import { createHash } from 'node:crypto';

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional().default('main'),
  token: z.string().optional(),
});

type GhEntry = { name: string; path: string; type: string; download_url: string | null; sha?: string };

function fileHash(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 32);
}

async function fetchJson(url: string, token: string | undefined): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'Amable-Studio' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

function encodeGithubPath(p: string): string {
  if (!p) return '';
  return p
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
}

async function collectFiles(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  token: string | undefined,
  out: { path: string; content: string }[],
  depth: number
): Promise<void> {
  if (depth > 40 || out.length > 200) return;
  const pathSeg = encodeGithubPath(path);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents${pathSeg ? '/' + pathSeg : ''}?ref=${encodeURIComponent(branch)}`;
  const data = (await fetchJson(url, token)) as GhEntry[] | GhEntry;
  const list = Array.isArray(data) ? data : [data];
  for (const item of list) {
    if (item.type === 'dir') {
      await collectFiles(owner, repo, branch, item.path, token, out, depth + 1);
    } else if (item.type === 'file' && item.download_url) {
      const ext = item.name.split('.').pop()?.toLowerCase();
      if (!ext || !['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'md'].includes(ext)) continue;
      const raw = await fetch(item.download_url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!raw.ok) continue;
      const text = await raw.text();
      out.push({ path: item.path, content: text });
    }
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: { members: { some: { userId: user.id, role: { not: 'viewer' } } } },
    },
  });
  if (!project) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const token = parsed.data.token ?? process.env.GITHUB_IMPORT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Falta token: envía {token} o configura GITHUB_IMPORT_TOKEN' },
      { status: 400 }
    );
  }
  const files: { path: string; content: string }[] = [];
  try {
    await collectFiles(parsed.data.owner, parsed.data.repo, parsed.data.branch, '', token, files, 0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'github_fetch_failed', details: msg }, { status: 502 });
  }
  if (files.length === 0) {
    return NextResponse.json({ error: 'No se importaron archivos reconocidos' }, { status: 422 });
  }
  await prisma.$transaction(
    files.map((f) => {
      const h = fileHash(f.content);
      const sz = Buffer.byteLength(f.content, 'utf8');
      return prisma.projectFile.upsert({
        where: { projectId_path: { projectId, path: f.path } },
        create: { projectId, path: f.path, content: f.content, hash: h, size: sz },
        update: { content: f.content, hash: h, size: sz },
      });
    })
  );
  await prisma.project.update({
    where: { id: projectId },
    data: { githubRepoFullName: `${parsed.data.owner}/${parsed.data.repo}` },
  });
  return NextResponse.json({ imported: files.length });
}
