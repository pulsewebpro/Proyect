import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';

type Ctx = { params: Promise<{ id: string; runId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId, runId } = await ctx.params;
  const run = await prisma.run.findFirst({
    where: {
      id: runId,
      projectId,
      project: { workspace: { members: { some: { userId: user.id } } } },
    },
    include: { steps: { orderBy: { order: 'asc' } }, messages: { orderBy: { createdAt: 'asc' } }, planDocument: true },
  });
  if (!run) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ run });
}
