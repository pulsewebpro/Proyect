import { describe, expect, it } from 'vitest';
import { assembleProductEngineState, fingerprintFromSeed, productEngineFingerprintSeed } from './product-engine-contract';

describe('productEngineFingerprintSeed', () => {
  it('changes when publication updates', () => {
    const a = productEngineFingerprintSeed({
      projectId: 'p1',
      fileCount: 2,
      totalBytes: 100,
      filesUpdatedAt: '2026-01-01T00:00:00.000Z',
      lastRunId: 'r1',
      lastRunFinishedAt: '2026-01-01T01:00:00.000Z',
      publicationSlug: 'foo',
      publicationStatus: 'live',
      publicationViteHash: 'abc',
      publicationUpdatedAt: '2026-01-01T02:00:00.000Z',
    });
    const b = productEngineFingerprintSeed({
      projectId: 'p1',
      fileCount: 2,
      totalBytes: 100,
      filesUpdatedAt: '2026-01-01T00:00:00.000Z',
      lastRunId: 'r1',
      lastRunFinishedAt: '2026-01-01T01:00:00.000Z',
      publicationSlug: 'foo',
      publicationStatus: 'live',
      publicationViteHash: 'def',
      publicationUpdatedAt: '2026-01-01T02:00:00.000Z',
    });
    expect(fingerprintFromSeed(a)).not.toBe(fingerprintFromSeed(b));
  });
});

describe('assembleProductEngineState', () => {
  it('builds version 1 payload', () => {
    const s = assembleProductEngineState({
      projectId: 'p1',
      fileCount: 1,
      totalBytes: 50,
      filesUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
      runsDone: 2,
      runsFailed: 0,
      creditsConsumedOnProject: 5,
      lastRun: null,
      publication: null,
    });
    expect(s.version).toBe(1);
    expect(s.fingerprint).toHaveLength(10);
    expect(s.creditsConsumedOnProject).toBe(5);
  });
});
