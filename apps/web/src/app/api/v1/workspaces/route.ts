import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: user.id } } },
    select: {
      id: true,
      name: true,
      plan: true,
      _count: { select: { projects: true } },
    },
  });
  return NextResponse.json({ workspaces });
}
