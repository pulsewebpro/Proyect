import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { z } from 'zod';

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().optional().default('main'),
  message: z.string().min(1).max(200).optional().default('Export from Amable Studio'),
  token: z.string().optional(),
});

async function ghJson(url: string, token: string, method: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Amable-Studio',
    Authorization: `Bearer ${token}`,
  };
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
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
      { error: 'Falta token PAT con scope repo (body.token o GITHUB_IMPORT_TOKEN)' },
      { status: 400 }
    );
  }
  const { owner, repo, branch, message } = parsed.data;
  const files = await prisma.projectFile.findMany({ where: { projectId } });
  if (files.length === 0) return NextResponse.json({ error: 'sin_archivos' }, { status: 400 });

  const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`;
  try {
    const ref = (await ghJson(refUrl, token, 'GET')) as { object?: { sha?: string } };
    const baseSha = ref.object?.sha;
    if (!baseSha) throw new Error('No branch ref');

    const treeElements = [];
    for (const f of files) {
      const blob = (await ghJson(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, token, 'POST', {
        content: Buffer.from(f.content, 'utf8').toString('base64'),
        encoding: 'base64',
      })) as { sha?: string };
      if (!blob.sha) throw new Error('blob failed');
      treeElements.push({
        path: f.path.replace(/\\/g, '/'),
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    const tree = (await ghJson(`https://api.github.com/repos/${owner}/${repo}/git/trees`, token, 'POST', {
      base_tree: baseSha,
      tree: treeElements,
    })) as { sha?: string };
    if (!tree.sha) throw new Error('tree failed');

    const commit = (await ghJson(`https://api.github.com/repos/${owner}/${repo}/git/commits`, token, 'POST', {
      message,
      tree: tree.sha,
      parents: [baseSha],
    })) as { sha?: string };
    if (!commit.sha) throw new Error('commit failed');

    await ghJson(refUrl, token, 'PATCH', { sha: commit.sha, force: false });

    await prisma.project.update({
      where: { id: projectId },
      data: { githubRepoFullName: `${owner}/${repo}` },
    });

    return NextResponse.json({
      ok: true,
      commitSha: commit.sha,
      branch,
      files: files.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'github_export_failed', details: msg.slice(0, 800) }, { status: 502 });
  }
}
