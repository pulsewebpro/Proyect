import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { RunMode, RunStatus } from '@prisma/client';

type Ctx = { params: Promise<{ id: string; threadId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId, threadId } = await ctx.params;
  const thread = await prisma.commentThread.findFirst({
    where: { id: threadId, projectId },
    include: { comments: { orderBy: { createdAt: 'asc' } } },
  });
  if (!thread) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const context = thread.comments.map((c: { userId: string; body: string }) => `${c.userId}: ${c.body}`).join('\n');
  const run = await prisma.run.create({
    data: {
      projectId,
      mode: RunMode.build,
      status: RunStatus.queued,
      prompt: `Contexto de comentarios para el agente:\n${context}`,
    },
  });
  try {
    const { getRunQueue } = await import('@/lib/queue');
    await getRunQueue().add('process', { runId: run.id }, { removeOnComplete: true });
  } catch {
    const { processRun } = await import('@amable/jobs');
    void processRun(run.id);
  }
  return NextResponse.json({ runId: run.id });
}
