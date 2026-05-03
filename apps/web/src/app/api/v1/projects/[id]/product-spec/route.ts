import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const spec = await prisma.projectProductSpec.findUnique({ where: { projectId } });
  if (!spec) return NextResponse.json({ spec: null });
  return NextResponse.json({ spec: spec.specJson, updatedAt: spec.updatedAt });
}
