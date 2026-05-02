import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@amable/db';
import { verifyPassword, signSession } from '@amable/auth';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/cookies';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  const token = await signSession({ sub: user.id, email: user.email });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
