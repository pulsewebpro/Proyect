import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { getCreditBalance } from '@amable/credits';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: workspaceId } = await ctx.params;
  const m = await prisma.workspaceMember.findFirst({ where: { workspaceId, userId: user.id } });
  if (!m) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  const balance = await getCreditBalance(workspaceId);
  return NextResponse.json({ balance });
}
