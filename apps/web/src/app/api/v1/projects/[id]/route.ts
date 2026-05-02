import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';

type Ctx = { params: Promise<{ id: string }> };

async function assertProjectAccess(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { workspace: { members: { some: { userId } } } },
        { members: { some: { userId } } },
      ],
    },
    include: { workspace: true },
  });
  return project;
}

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await ctx.params;
  const project = await assertProjectAccess(user.id, id);
  if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ project });
}
