import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { z } from 'zod';
import { IntegrationType, type Prisma } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };

const typeSchema = z.enum(['stripe', 'supabase', 'github']);

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const list = await prisma.projectIntegration.findMany({ where: { projectId } });
  return NextResponse.json({
    integrations: list.map((i) => ({
      type: i.type,
      enabled: i.enabled,
      config: i.config,
      hasSecrets: i.secrets != null && Object.keys((i.secrets as object) ?? {}).length > 0,
    })),
  });
}

const patchSchema = z.object({
  type: typeSchema,
  enabled: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
  secrets: z.record(z.unknown()).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
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
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const t = parsed.data.type as IntegrationType;
  const existing = await prisma.projectIntegration.findUnique({
    where: { projectId_type: { projectId, type: t } },
  });
  const nextConfig: Prisma.InputJsonValue | undefined =
    parsed.data.config != null
      ? ({ ...((existing?.config as object) ?? {}), ...parsed.data.config } as Prisma.InputJsonValue)
      : existing?.config != null
        ? (existing.config as Prisma.InputJsonValue)
        : undefined;
  const nextSecrets: Prisma.InputJsonValue | undefined =
    parsed.data.secrets != null
      ? ({ ...((existing?.secrets as object) ?? {}), ...parsed.data.secrets } as Prisma.InputJsonValue)
      : existing?.secrets != null
        ? (existing.secrets as Prisma.InputJsonValue)
        : undefined;
  const row = await prisma.projectIntegration.upsert({
    where: { projectId_type: { projectId, type: t } },
    create: {
      projectId,
      type: t,
      enabled: parsed.data.enabled ?? false,
      ...(nextConfig !== undefined ? { config: nextConfig } : {}),
      ...(nextSecrets !== undefined ? { secrets: nextSecrets } : {}),
    },
    update: {
      enabled: parsed.data.enabled ?? existing?.enabled ?? false,
      ...(parsed.data.config != null ? { config: nextConfig } : {}),
      ...(parsed.data.secrets != null ? { secrets: nextSecrets } : {}),
    },
  });
  return NextResponse.json({
    type: row.type,
    enabled: row.enabled,
    config: row.config,
    hasSecrets: row.secrets != null && Object.keys((row.secrets as object) ?? {}).length > 0,
  });
}
