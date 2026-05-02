import { NextResponse } from 'next/server';
import { prisma } from '@amable/db';
import { bundleProjectFiles, previewShellHtml } from '@/server/preview-bundle';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const pub = await prisma.publication.findFirst({
    where: { slug, status: 'live' },
    include: { project: true },
  });
  if (!pub) return new NextResponse('No publicado', { status: 404 });
  const rows = await prisma.projectFile.findMany({
    where: { projectId: pub.projectId },
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
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  const html = previewShellHtml(js, pub.project.name);
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
