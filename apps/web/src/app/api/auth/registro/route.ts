import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@amable/db';
import { hashPassword, signSession } from '@amable/auth';
import { WorkspacePlan, WorkspaceRole, IdentityProvider, CreditEntryType } from '@prisma/client';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/cookies';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 });
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name: name ?? email.split('@')[0],
      passwordHash,
      identities: {
        create: { provider: IdentityProvider.password, providerUserId: email, emailVerified: false },
      },
      preferences: { create: {} },
    },
  });
  const workspace = await prisma.workspace.create({
    data: {
      name: `${user.name ?? 'Mi'} espacio`,
      plan: WorkspacePlan.free,
      monthlyCredits: 30,
      dailyBonusCredits: 5,
    },
  });
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: user.id, role: WorkspaceRole.owner },
  });
  await prisma.creditLedger.createMany({
    data: [
      {
        workspaceId: workspace.id,
        type: CreditEntryType.grant_monthly,
        amount: 30,
        balanceAfter: 30,
        reason: 'Plan Free inicial',
      },
      {
        workspaceId: workspace.id,
        type: CreditEntryType.grant_daily,
        amount: 5,
        balanceAfter: 35,
        reason: 'Créditos diarios',
      },
    ],
  });
  const token = await signSession({ sub: user.id, email: user.email });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
