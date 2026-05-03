import { prisma } from '@amable/db';
import { PublicationStatus, RunStatus } from '@prisma/client';
import { assembleProductEngineState, type ProductEngineState } from '@/lib/product-engine-contract';

export async function getProductEngineStateForProject(projectId: string): Promise<ProductEngineState> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { workspaceId: true },
  });
  if (!project) {
    throw new Error('project_not_found');
  }

  const [fileCount, agg, lastRun, runsDone, runsFailed, publication, runIds] = await Promise.all([
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
    prisma.run.count({ where: { projectId, status: RunStatus.failed } }),
    prisma.publication.findFirst({
      where: { projectId, status: PublicationStatus.live },
      orderBy: { publishedAt: 'desc' },
      select: {
        slug: true,
        status: true,
        liveUrl: true,
        viteContentHash: true,
        publishedAt: true,
        updatedAt: true,
      },
    }),
    prisma.run.findMany({ where: { projectId }, select: { id: true } }),
  ]);

  const ids = runIds.map((r) => r.id);
  let creditsConsumedOnProject = 0;
  if (ids.length > 0) {
    const byRunId = await prisma.creditLedger.aggregate({
      where: {
        workspaceId: project.workspaceId,
        type: 'consume',
        runId: { in: ids },
      },
      _sum: { amount: true },
    });
    creditsConsumedOnProject = Math.abs(byRunId._sum?.amount ?? 0);
  }

  const totalBytes = agg._sum?.size ?? 0;

  return assembleProductEngineState({
    projectId,
    fileCount,
    totalBytes,
    filesUpdatedAt: agg._max?.updatedAt ?? null,
    runsDone,
    runsFailed,
    creditsConsumedOnProject,
    lastRun,
    publication,
  });
}
