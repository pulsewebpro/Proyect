import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });
  const { id: projectId } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!ok) return new NextResponse('No encontrado', { status: 404 });
  const file = await prisma.projectFile.findFirst({
    where: { projectId, path: 'src/App.tsx' },
  });
  const code = escapeHtml(file?.content ?? '// sin App.tsx');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Vista previa</title><style>body{margin:0;background:#0f0f0f;color:#f6f3ed;font:14px/1.5 system-ui}header{padding:10px 14px;border-bottom:1px solid #2a2a2a}main{padding:14px}pre{white-space:pre-wrap;word-break:break-word;background:#1b1b1b;border:1px solid #2b2b2b;border-radius:10px;padding:12px}</style></head><body><header>Vista previa (representación del código fuente)</header><main><pre>${code}</pre></main></body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
