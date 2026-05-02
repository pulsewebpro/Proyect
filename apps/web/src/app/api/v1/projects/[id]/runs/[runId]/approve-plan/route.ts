import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { RunMode, RunStatus } from '@prisma/client';
import { getRunQueue } from '@/lib/queue';

type Ctx = { params: Promise<{ id: string; runId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId, runId } = await ctx.params;
  const run = await prisma.run.findFirst({
    where: {
      id: runId,
      projectId,
      mode: RunMode.plan,
      project: { workspace: { members: { some: { userId: user.id, role: { not: 'viewer' } } } } },
    },
    include: { planDocument: true },
  });
  if (!run?.planDocument) return NextResponse.json({ error: 'Plan no disponible' }, { status: 400 });
  await prisma.planDocument.update({
    where: { id: run.planDocument.id },
    data: { approved: true },
  });
  const buildRun = await prisma.run.create({
    data: {
      projectId,
      mode: RunMode.build,
      status: RunStatus.queued,
      prompt: `Ejecutar plan aprobado:\n${run.planDocument.content}`,
    },
  });
  try {
    await getRunQueue().add('process', { runId: buildRun.id }, { removeOnComplete: true });
  } catch {
    const { processRun } = await import('@amable/jobs');
    void processRun(buildRun.id);
  }
  return NextResponse.json({ runId: buildRun.id });
}
