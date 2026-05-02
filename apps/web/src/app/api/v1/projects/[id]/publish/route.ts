import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { publishProjectSchema } from '@amable/shared';
import { PublicationAudience, PublicationStatus } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };

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
  const parsed = publishProjectSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const base = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
  const audience =
    parsed.data.audience === 'workspace' ? PublicationAudience.workspace : PublicationAudience.anyone;
  const pub = await prisma.publication.upsert({
    where: { projectId_slug: { projectId, slug: parsed.data.slug } },
    create: {
      projectId,
      audience,
      slug: parsed.data.slug,
      status: PublicationStatus.live,
      liveUrl: `${base}/sitio/${project.slug}`,
      versionRef: `git:${project.primaryBranch}`,
      publishedAt: new Date(),
      seoTitle: project.name,
    },
    update: {
      audience,
      status: PublicationStatus.live,
      liveUrl: `${base}/sitio/${parsed.data.slug}`,
      publishedAt: new Date(),
    },
  });
  if (parsed.data.primaryDomain) {
    await prisma.domainBinding.create({
      data: {
        publicationId: pub.id,
        hostname: parsed.data.primaryDomain,
        sslStatus: 'pending',
        verified: false,
        isPrimary: true,
      },
    });
  }
  return NextResponse.json({
    publicationId: pub.id,
    status: 'live',
    targetUrl: pub.liveUrl,
  });
}
