import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@amable/db';
import { hashPassword } from '@amable/auth';
import { createHash } from 'node:crypto';
import { checkRateLimit, clientIpFromRequest } from '@/lib/rate-limit';

const bodySchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128),
});

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const rl = checkRateLimit(`pwreset:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const tokenHash = hashToken(parsed.data.token);
  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Enlace inválido o caducado' }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId, id: { not: row.id } } }),
  ]);

  return NextResponse.json({ ok: true });
}
