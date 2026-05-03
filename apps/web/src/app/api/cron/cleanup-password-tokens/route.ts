import { NextResponse } from 'next/server';
import { prisma } from '@amable/db';
import { timingSafeEqual } from 'node:crypto';

function auth(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 16) return false;
  const h = req.headers.get('authorization');
  if (!h?.startsWith('Bearer ')) return false;
  const tok = h.slice(7);
  try {
    return timingSafeEqual(Buffer.from(tok), Buffer.from(secret));
  } catch {
    return false;
  }
}

/** Limpia tokens de restablecimiento caducados (Vercel Cron u otro scheduler). */
export async function GET(req: Request) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const r = await prisma.passwordResetToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
  });
  return NextResponse.json({ deleted: r.count });
}
