import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { commentCreateSchema } from '@amable/shared';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const threads = await prisma.commentThread.findMany({
    where: { projectId },
    include: { comments: { include: { user: { select: { id: true, name: true, email: true } } } } },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ threads });
}

export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const json = await req.json().catch(() => null);
  const parsed = commentCreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const { body, anchorSelector, threadId } = parsed.data;
  let thread;
  if (threadId) {
    thread = await prisma.commentThread.findFirst({ where: { id: threadId, projectId } });
    if (!thread) return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
  } else {
    thread = await prisma.commentThread.create({
      data: { projectId, anchorSelector: anchorSelector ?? null, title: body.slice(0, 80) },
    });
  }
  const comment = await prisma.comment.create({
    data: { threadId: thread.id, userId: user.id, body },
  });
  return NextResponse.json({ thread, comment });
}
