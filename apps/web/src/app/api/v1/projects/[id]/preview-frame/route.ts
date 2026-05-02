import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { bundleProjectFiles, previewShellHtml } from '@/server/preview-bundle';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return new NextResponse('No autorizado', { status: 401 });
  const { id: projectId } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!ok) return new NextResponse('No encontrado', { status: 404 });
  const rows = await prisma.projectFile.findMany({
    where: { projectId },
    select: { path: true, content: true },
  });
  const { js, errors } = await bundleProjectFiles(rows);
  if (errors.length) {
    const errHtml = previewShellHtml(
      `document.body.innerHTML='<pre style="padding:16px;white-space:pre-wrap;font:12px monospace;color:#f87171">'+${JSON.stringify(errors.join('\n'))}+'</pre>';`,
      'Error de compilación'
    );
    return new NextResponse(errHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
      },
    });
  }
  const html = previewShellHtml(js, ok.name);
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
