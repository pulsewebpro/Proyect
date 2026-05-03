import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import path from 'node:path';
import { readViteAsset } from '@/server/vite-project-build';

type Ctx = { params: Promise<{ id: string; hash: string; path: string[] }> };

function contentType(file: string): string {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.mjs') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.woff2') return 'font/woff2';
  return 'application/octet-stream';
}

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });
  const { id: projectId, hash, path: segs } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!ok) return new NextResponse('No encontrado', { status: 404 });
  const rel = segs.join('/');
  if (!rel || rel.includes('..')) return new NextResponse('No válido', { status: 400 });
  const buf = await readViteAsset(projectId, hash, rel);
  if (!buf) return new NextResponse('No encontrado', { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': contentType(rel),
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
