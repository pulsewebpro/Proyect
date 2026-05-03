import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { timingSafeEqual } from 'node:crypto';
import { signOpsCookieValue, verifyOpsCookieValue, OPS_COOKIE_NAME, opsCookieOptions } from '@/lib/ops-session';
import { checkRateLimit, clientIpFromRequest } from '@/lib/rate-limit';

const bodySchema = z.object({ secret: z.string().min(8) });

function safeCompare(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  const expected = process.env.OPERATIONS_SECRET?.trim();
  if (!expected || expected.length < 16) {
    return NextResponse.json({ error: 'OPERATIONS_SECRET no configurado en el servidor' }, { status: 503 });
  }
  const ip = clientIpFromRequest(req);
  const rl = checkRateLimit(`opslogin:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Inválido' }, { status: 400 });
  if (!safeCompare(parsed.data.secret, expected)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const token = await signOpsCookieValue();
  const jar = await cookies();
  jar.set(OPS_COOKIE_NAME, token, opsCookieOptions());
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(OPS_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const jar = await cookies();
  const v = jar.get(OPS_COOKIE_NAME)?.value;
  if (!v) return NextResponse.json({ ok: false });
  const ok = await verifyOpsCookieValue(v);
  return NextResponse.json({ ok });
}
