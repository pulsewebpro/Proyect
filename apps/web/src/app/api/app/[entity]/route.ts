import { NextResponse } from 'next/server';
import { prisma } from '@amable/db';
import { z } from 'zod';
import { resolveProjectIdForGeneratedApi } from '@/server/generated-api-context';
import { getGeneratedAppUser } from '@/server/generated-app-session';
import type { Prisma } from '@prisma/client';

type Ctx = { params: Promise<{ entity: string }> };

const entityName = z.string().min(1).max(64).regex(/^[A-Za-z][A-Za-z0-9_]*$/);

export async function GET(req: Request, ctx: Ctx) {
  const projectId = await resolveProjectIdForGeneratedApi(req);
  if (!projectId) return NextResponse.json({ error: 'contexto_requerido' }, { status: 400 });
  const { entity: raw } = await ctx.params;
  const entity = entityName.safeParse(raw);
  if (!entity.success) return NextResponse.json({ error: 'entidad_inválida' }, { status: 400 });
  const rows = await prisma.generatedRow.findMany({
    where: { projectId, entity: entity.data },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ items: rows.map((r) => ({ id: r.id, ...((r.data as object) ?? {}) })) });
}

export async function POST(req: Request, ctx: Ctx) {
  const projectId = await resolveProjectIdForGeneratedApi(req);
  if (!projectId) return NextResponse.json({ error: 'contexto_requerido' }, { status: 400 });
  const { entity: raw } = await ctx.params;
  const entity = entityName.safeParse(raw);
  if (!entity.success) return NextResponse.json({ error: 'entidad_inválida' }, { status: 400 });
  const actor = await getGeneratedAppUser(projectId);
  const body = await req.json().catch(() => null);
  const data = z.record(z.unknown()).safeParse(body);
  if (!data.success) return NextResponse.json({ error: data.error.flatten() }, { status: 400 });

  /** Public waitlist join (landing template) — no session required */
  if (entity.data === 'WaitlistEntry') {
    const wl = z
      .object({
        name: z.string().min(1).max(120),
        email: z.string().email().max(254),
        role: z.string().max(64).optional(),
      })
      .safeParse(data.data);
    if (!wl.success) return NextResponse.json({ error: wl.error.flatten() }, { status: 400 });
    const row = await prisma.generatedRow.create({
      data: {
        projectId,
        entity: 'WaitlistEntry',
        data: {
          ...wl.data,
          _createdBy: actor?.userId ?? 'public_waitlist',
          _source: 'public_waitlist',
        } as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ id: row.id, ...((row.data as object) ?? {}) });
  }

  if (!actor) return NextResponse.json({ error: 'auth_requerida' }, { status: 401 });
  const row = await prisma.generatedRow.create({
    data: { projectId, entity: entity.data, data: { ...data.data, _createdBy: actor.userId } as Prisma.InputJsonValue },
  });
  return NextResponse.json({ id: row.id, ...((row.data as object) ?? {}) });
}
