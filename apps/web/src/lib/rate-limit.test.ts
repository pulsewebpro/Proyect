import { describe, expect, it } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
  it('allows under limit', () => {
    expect(checkRateLimit('t1', 3, 60000).ok).toBe(true);
    expect(checkRateLimit('t1', 3, 60000).ok).toBe(true);
    expect(checkRateLimit('t1', 3, 60000).ok).toBe(true);
  });

  it('blocks over limit', () => {
    const k = `t2-${Math.random()}`;
    expect(checkRateLimit(k, 2, 60000).ok).toBe(true);
    expect(checkRateLimit(k, 2, 60000).ok).toBe(true);
    const r = checkRateLimit(k, 2, 60000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSec).toBeGreaterThan(0);
  });
});
