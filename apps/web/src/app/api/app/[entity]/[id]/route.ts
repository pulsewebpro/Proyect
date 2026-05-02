import { NextResponse } from 'next/server';
import { prisma } from '@amable/db';
import { z } from 'zod';
import { resolveProjectIdForGeneratedApi } from '@/server/generated-api-context';
import { getGeneratedAppUser } from '@/server/generated-app-session';
import type { Prisma } from '@prisma/client';

type Ctx = { params: Promise<{ entity: string; id: string }> };

const entityName = z.string().min(1).max(64).regex(/^[A-Za-z][A-Za-z0-9_]*$/);

export async function GET(req: Request, ctx: Ctx) {
  const projectId = await resolveProjectIdForGeneratedApi(req);
  if (!projectId) return NextResponse.json({ error: 'contexto_requerido' }, { status: 400 });
  const { entity: raw, id } = await ctx.params;
  const entity = entityName.safeParse(raw);
  if (!entity.success) return NextResponse.json({ error: 'entidad_inválida' }, { status: 400 });
  const row = await prisma.generatedRow.findFirst({
    where: { id, projectId, entity: entity.data },
  });
  if (!row) return NextResponse.json({ error: 'no_encontrado' }, { status: 404 });
  return NextResponse.json({ id: row.id, ...((row.data as object) ?? {}) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const projectId = await resolveProjectIdForGeneratedApi(req);
  if (!projectId) return NextResponse.json({ error: 'contexto_requerido' }, { status: 400 });
  const actor = await getGeneratedAppUser(projectId);
  if (!actor || actor.role !== 'admin') {
    return NextResponse.json({ error: 'solo_admin' }, { status: 403 });
  }
  const { entity: raw, id } = await ctx.params;
  const entity = entityName.safeParse(raw);
  if (!entity.success) return NextResponse.json({ error: 'entidad_inválida' }, { status: 400 });
  const body = await req.json().catch(() => null);
  const data = z.record(z.unknown()).safeParse(body);
  if (!data.success) return NextResponse.json({ error: data.error.flatten() }, { status: 400 });
  const existing = await prisma.generatedRow.findFirst({
    where: { id, projectId, entity: entity.data },
  });
  if (!existing) return NextResponse.json({ error: 'no_encontrado' }, { status: 404 });
  const merged = { ...((existing.data as object) ?? {}), ...data.data } as Prisma.InputJsonValue;
  const row = await prisma.generatedRow.update({
    where: { id },
    data: { data: merged },
  });
  return NextResponse.json({ id: row.id, ...((row.data as object) ?? {}) });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const projectId = await resolveProjectIdForGeneratedApi(req);
  if (!projectId) return NextResponse.json({ error: 'contexto_requerido' }, { status: 400 });
  const actor = await getGeneratedAppUser(projectId);
  if (!actor || actor.role !== 'admin') {
    return NextResponse.json({ error: 'solo_admin' }, { status: 403 });
  }
  const { entity: raw, id } = await ctx.params;
  const entity = entityName.safeParse(raw);
  if (!entity.success) return NextResponse.json({ error: 'entidad_inválida' }, { status: 400 });
  const existing = await prisma.generatedRow.findFirst({
    where: { id, projectId, entity: entity.data },
  });
  if (!existing) return NextResponse.json({ error: 'no_encontrado' }, { status: 404 });
  await prisma.generatedRow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
