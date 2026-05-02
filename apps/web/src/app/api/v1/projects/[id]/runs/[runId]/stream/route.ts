import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { RunStatus } from '@prisma/client';

type Ctx = { params: Promise<{ id: string; runId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return new Response('No autorizado', { status: 401 });
  const { id: projectId, runId } = await ctx.params;
  const ok = await prisma.run.findFirst({
    where: {
      id: runId,
      projectId,
      project: { workspace: { members: { some: { userId: user.id } } } },
    },
  });
  if (!ok) return new Response('No encontrado', { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastMsg = '';
      let lastStep = '';
      for (let i = 0; i < 120; i++) {
        const run = await prisma.run.findUnique({
          where: { id: runId },
          include: { steps: { orderBy: { order: 'asc' } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!run) break;
        const stepSig = JSON.stringify(run.steps.map((s) => [s.id, s.status, s.name]));
        const msgSig = run.messages[0]?.content ?? '';
        if (stepSig !== lastStep || msgSig !== lastMsg) {
          lastStep = stepSig;
          lastMsg = msgSig;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ run })}\n\n`));
        }
        if (run.status === RunStatus.done || run.status === RunStatus.failed || run.status === RunStatus.cancelled) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ run, done: true })}\n\n`));
          break;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
