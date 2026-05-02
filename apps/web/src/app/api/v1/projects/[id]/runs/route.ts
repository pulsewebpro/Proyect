import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { createRunSchema } from '@amable/shared';
import { RunMode, RunStatus } from '@prisma/client';
import { getRunQueue } from '@/lib/queue';
import { getCreditBalance } from '@amable/credits';

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
    include: { workspace: true },
  });
  if (!project) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  const balance = await getCreditBalance(project.workspaceId);
  if (balance < 1) {
    return NextResponse.json({ error: 'Créditos insuficientes' }, { status: 402 });
  }
  const json = await req.json().catch(() => null);
  const parsed = createRunSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const mode = parsed.data.mode === 'plan' ? RunMode.plan : RunMode.build;
  const run = await prisma.run.create({
    data: {
      projectId,
      mode,
      status: RunStatus.queued,
      prompt: parsed.data.prompt,
    },
  });
  try {
    const q = getRunQueue();
    await q.add('process', { runId: run.id }, { removeOnComplete: true });
  } catch {
    const { processRun } = await import('@amable/jobs');
    void processRun(run.id);
  }
  return NextResponse.json({
    runId: run.id,
    status: 'queued',
    streamUrl: `/api/v1/projects/${projectId}/runs/${run.id}/stream`,
    estimatedCreditMode: 'fixed',
    creditEstimate: mode === RunMode.plan ? 1 : 1,
  });
}
