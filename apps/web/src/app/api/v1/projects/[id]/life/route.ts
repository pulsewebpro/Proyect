import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { RunStatus } from '@prisma/client';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;

  const ok = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { workspace: { members: { some: { userId: user.id } } } },
        { members: { some: { userId: user.id } } },
      ],
    },
    select: { id: true },
  });
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const [fileCount, agg, lastRun, runsDone] = await Promise.all([
    prisma.projectFile.count({ where: { projectId } }),
    prisma.projectFile.aggregate({
      where: { projectId },
      _sum: { size: true },
      _max: { updatedAt: true },
    }),
    prisma.run.findFirst({
      where: { projectId, status: { in: [RunStatus.done, RunStatus.failed] } },
      orderBy: [{ finishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        mode: true,
        status: true,
        outputTemplate: true,
        creditsUsed: true,
        finishedAt: true,
        createdAt: true,
        errorMessage: true,
      },
    }),
    prisma.run.count({ where: { projectId, status: RunStatus.done } }),
  ]);

  const totalBytes = agg._sum?.size ?? 0;
  const filesUpdatedAt = agg._max?.updatedAt?.toISOString() ?? null;

  const sig = [
    projectId,
    String(fileCount),
    String(totalBytes),
    filesUpdatedAt ?? '',
    lastRun?.id ?? '',
    lastRun?.finishedAt?.toISOString() ?? '',
  ].join('|');
  const fingerprint = createHash('sha256').update(sig).digest('hex').slice(0, 10);

  const lastEventAt =
    lastRun?.finishedAt?.toISOString() ?? lastRun?.createdAt.toISOString() ?? filesUpdatedAt ?? null;

  return NextResponse.json({
    fingerprint,
    fileCount,
    totalBytes,
    filesUpdatedAt,
    runsDone,
    lastRun: lastRun
      ? {
          id: lastRun.id,
          mode: lastRun.mode,
          status: lastRun.status,
          outputTemplate: lastRun.outputTemplate,
          creditsUsed: Number(lastRun.creditsUsed),
          finishedAt: lastRun.finishedAt?.toISOString() ?? null,
          createdAt: lastRun.createdAt.toISOString(),
          errorMessage: lastRun.errorMessage,
        }
      : null,
    lastEventAt,
  });
}
