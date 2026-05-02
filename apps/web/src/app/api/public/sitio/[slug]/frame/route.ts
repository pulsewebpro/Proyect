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
    return new NextResponse('Error de compilación del proyecto publicado', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
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
