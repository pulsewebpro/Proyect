import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { z } from 'zod';

type Ctx = { params: Promise<{ id: string; threadId: string }> };

const bodySchema = z.object({ resolved: z.boolean() });

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId, threadId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const thread = await prisma.commentThread.findFirst({
    where: { id: threadId, projectId },
    include: { project: { include: { workspace: { include: { members: true } } } } },
  });
  if (!thread) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const member = thread.project.workspace.members.find((m) => m.userId === user.id);
  if (!member || member.role === 'viewer') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }
  const updated = await prisma.commentThread.update({
    where: { id: threadId },
    data: { resolved: parsed.data.resolved, unread: false },
  });
  return NextResponse.json({ thread: updated });
}
