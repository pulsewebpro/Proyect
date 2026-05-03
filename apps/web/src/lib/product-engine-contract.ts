import { createHash } from 'node:crypto';
import type { PublicationStatus, RunStatus } from '@prisma/client';

export const PRODUCT_ENGINE_VERSION = 1 as const;

/** Single contract: preview and publish read the same tree; this is the live product state. */
export type ProductEngineRunSummary = {
  id: string;
  mode: string;
  status: string;
  outputTemplate: string | null;
  creditsUsed: number;
  finishedAt: string | null;
  createdAt: string;
  errorMessage: string | null;
};

export type ProductEnginePublication = {
  slug: string | null;
  status: string;
  liveUrl: string | null;
  viteContentHash: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export type ProductEngineState = {
  version: typeof PRODUCT_ENGINE_VERSION;
  fingerprint: string;
  fileCount: number;
  totalBytes: number;
  filesUpdatedAt: string | null;
  runsDone: number;
  runsFailed: number;
  /** Sum of credits charged on all runs for this project (ledger of record for the builder). */
  creditsConsumedOnProject: number;
  lastRun: ProductEngineRunSummary | null;
  publication: ProductEnginePublication | null;
  lastEventAt: string | null;
};

export function productEngineFingerprintSeed(input: {
  projectId: string;
  fileCount: number;
  totalBytes: number;
  filesUpdatedAt: string | null;
  lastRunId: string | null;
  lastRunFinishedAt: string | null;
  publicationSlug: string | null;
  publicationStatus: string;
  publicationViteHash: string | null;
  publicationUpdatedAt: string | null;
}): string {
  return [
    input.projectId,
    String(input.fileCount),
    String(input.totalBytes),
    input.filesUpdatedAt ?? '',
    input.lastRunId ?? '',
    input.lastRunFinishedAt ?? '',
    input.publicationSlug ?? '',
    input.publicationStatus,
    input.publicationViteHash ?? '',
    input.publicationUpdatedAt ?? '',
  ].join('|');
}

export function fingerprintFromSeed(seed: string): string {
  return createHash('sha256').update(seed).digest('hex').slice(0, 10);
}

export type ProductEngineRunRow = {
  id: string;
  mode: string;
  status: RunStatus;
  outputTemplate: string | null;
  creditsUsed: unknown;
  finishedAt: Date | null;
  createdAt: Date;
  errorMessage: string | null;
};

export type ProductEnginePublicationRow = {
  slug: string;
  status: PublicationStatus;
  liveUrl: string | null;
  viteContentHash: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export function assembleProductEngineState(input: {
  projectId: string;
  fileCount: number;
  totalBytes: number;
  filesUpdatedAt: Date | null;
  runsDone: number;
  runsFailed: number;
  creditsConsumedOnProject: number;
  lastRun: ProductEngineRunRow | null;
  publication: ProductEnginePublicationRow | null;
}): ProductEngineState {
  const filesUpdatedAt = input.filesUpdatedAt?.toISOString() ?? null;
  const lastRun = input.lastRun;
  const lastRunFinishedAt = lastRun?.finishedAt?.toISOString() ?? null;
  const pub = input.publication;

  const seed = productEngineFingerprintSeed({
    projectId: input.projectId,
    fileCount: input.fileCount,
    totalBytes: input.totalBytes,
    filesUpdatedAt,
    lastRunId: lastRun?.id ?? null,
    lastRunFinishedAt,
    publicationSlug: pub?.slug ?? null,
    publicationStatus: pub?.status ?? 'none',
    publicationViteHash: pub?.viteContentHash ?? null,
    publicationUpdatedAt: pub?.updatedAt.toISOString() ?? null,
  });

  const lastEventAt = maxIso(
    filesUpdatedAt,
    lastRunFinishedAt,
    lastRun?.createdAt.toISOString() ?? null,
    pub?.publishedAt?.toISOString() ?? null,
    pub?.updatedAt.toISOString() ?? null
  );

  return {
    version: PRODUCT_ENGINE_VERSION,
    fingerprint: fingerprintFromSeed(seed),
    fileCount: input.fileCount,
    totalBytes: input.totalBytes,
    filesUpdatedAt,
    runsDone: input.runsDone,
    runsFailed: input.runsFailed,
    creditsConsumedOnProject: input.creditsConsumedOnProject,
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
    publication: pub
      ? {
          slug: pub.slug,
          status: pub.status,
          liveUrl: pub.liveUrl,
          viteContentHash: pub.viteContentHash,
          publishedAt: pub.publishedAt?.toISOString() ?? null,
          updatedAt: pub.updatedAt.toISOString(),
        }
      : null,
    lastEventAt,
  };
}

function maxIso(...values: (string | null)[]): string | null {
  const ok = values.filter((v): v is string => v != null && v.length > 0);
  if (ok.length === 0) return null;
  let best = ok[0]!;
  for (const v of ok) {
    if (v > best) best = v;
  }
  return best;
}
