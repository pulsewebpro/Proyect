import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@amable/db';
import { createHash, randomBytes } from 'node:crypto';
import { sendTransactionalEmail } from '@/lib/email';
import { checkRateLimit, clientIpFromRequest } from '@/lib/rate-limit';

const bodySchema = z.object({ email: z.string().email() });

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const rlIp = checkRateLimit(`pwreq:${ip}`, 5, 60 * 60 * 1000);
  if (!rlIp.ok) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Correo inválido' }, { status: 400 });

  const rlEmail = checkRateLimit(`pwreq:email:${parsed.data.email.toLowerCase()}`, 3, 60 * 60 * 1000);
  if (!rlEmail.ok) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  const raw = randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const base = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
  const link = `${base.replace(/\/$/, '')}/nueva-contrasena?token=${raw}`;
  const support = process.env.SUPPORT_EMAIL ?? 'soporte@tudominio.com';

  const html = `
<p>Hola,</p>
<p>Has solicitado restablecer la contraseña de <strong>Amable Studio</strong>.</p>
<p><a href="${link}">Crear nueva contraseña</a> (válido 1 hora)</p>
<p>Si no fuiste tú, ignora este mensaje.</p>
<p>— Amable Studio · <a href="mailto:${support}">${support}</a></p>
`.trim();

  await sendTransactionalEmail({
    to: user.email,
    subject: 'Restablecer contraseña — Amable Studio',
    html,
  });

  return NextResponse.json({ ok: true });
}
