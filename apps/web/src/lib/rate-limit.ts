type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

export function clientIpFromRequest(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0]?.trim() || 'unknown';
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr.trim();
  return 'unknown';
}

/**
 * Simple in-memory fixed window rate limit (per server instance).
 * For distributed production, use Redis or a gateway limiter.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfterSec: number } {
  const t = now();
  const b = buckets.get(key);
  if (!b || t >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: t + windowMs });
    return { ok: true };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - t) / 1000)) };
  }
  b.count += 1;
  return { ok: true };
}
