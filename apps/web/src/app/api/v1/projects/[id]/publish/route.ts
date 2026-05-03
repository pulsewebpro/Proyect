import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { publishProjectSchema } from '@amable/shared';
import { PublicationAudience, PublicationStatus } from '@prisma/client';
import { bundleProjectFiles } from '@/server/preview-bundle';
import { runPublishPackageJsonGate } from '@/server/publish-security-gate';
import { buildViteProjectIfApplicable, projectUsesVite } from '@/server/vite-project-build';

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
  const slug = parsed.data.slug;
  const liveUrl = `${base}/sitio/${slug}`;

  const files = await prisma.projectFile.findMany({
    where: { projectId },
    select: { path: true, content: true },
  });

  if (parsed.data.runSecurityCheck) {
    const gate = runPublishPackageJsonGate(files);
    if (gate.blocked) {
      return NextResponse.json(
        { error: 'revisión_paquete_fallida', details: gate.findings },
        { status: 422 }
      );
    }
  }

  let viteHash: string | null = null;
  if (projectUsesVite(files)) {
    const vite = await buildViteProjectIfApplicable(projectId, files);
    if (!vite.ok) {
      return NextResponse.json(
        { error: 'vite_build_failed', details: [vite.reason] },
        { status: 422 }
      );
    }
    viteHash = vite.contentHash;
  } else {
    const build = await bundleProjectFiles(files);
    if (build.errors.length) {
      return NextResponse.json(
        { error: 'compilación_fallida', details: build.errors },
        { status: 422 }
      );
    }
  }

  const pub = await prisma.publication.upsert({
    where: { projectId_slug: { projectId, slug } },
    create: {
      projectId,
      audience,
      slug,
      status: PublicationStatus.live,
      liveUrl,
      versionRef: `git:${project.primaryBranch}`,
      publishedAt: new Date(),
      seoTitle: project.name,
      viteContentHash: viteHash,
    },
    update: {
      audience,
      slug,
      status: PublicationStatus.live,
      liveUrl,
      publishedAt: new Date(),
      viteContentHash: viteHash,
    },
  });
  if (parsed.data.primaryDomain) {
    const existing = await prisma.domainBinding.findFirst({
      where: { hostname: parsed.data.primaryDomain },
    });
    if (!existing) {
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
  }
  return NextResponse.json({
    publicationId: pub.id,
    status: 'live',
    targetUrl: pub.liveUrl,
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
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
  await prisma.$transaction(async (tx) => {
    await tx.domainBinding.deleteMany({
      where: { publication: { projectId } },
    });
    await tx.publication.updateMany({
      where: { projectId, status: 'live' },
      data: { status: PublicationStatus.unpublished, liveUrl: null },
    });
  });
  return NextResponse.json({ ok: true });
}
