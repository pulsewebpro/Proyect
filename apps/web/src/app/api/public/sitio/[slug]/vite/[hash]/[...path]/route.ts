import { NextResponse } from 'next/server';
import { prisma } from '@amable/db';
import path from 'node:path';
import { readViteAsset } from '@/server/vite-project-build';

type Ctx = { params: Promise<{ slug: string; hash: string; path: string[] }> };

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
  const { slug, hash, path: segs } = await ctx.params;
  const pub = await prisma.publication.findFirst({
    where: { slug, status: 'live' },
  });
  if (!pub) return new NextResponse('No publicado', { status: 404 });
  const rel = segs.join('/');
  if (!rel || rel.includes('..')) return new NextResponse('No válido', { status: 400 });
  const buf = await readViteAsset(pub.projectId, hash, rel);
  if (!buf) return new NextResponse('No encontrado', { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': contentType(rel),
      'Cache-Control': 'public, max-age=300',
    },
  });
}
