import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { createProjectSchema } from '@amable/shared';

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId requerido' }, { status: 400 });
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: user.id },
  });
  if (!member) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { workspaceId, name, slug, folderId } = parsed.data;
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: user.id },
  });
  if (!member || member.role === 'viewer') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }
  const project = await prisma.project.create({
    data: {
      workspaceId,
      name,
      slug,
      folderId,
      members: { create: { userId: user.id, role: 'admin' } },
    },
  });
  const { ensureDefaultFiles } = await import('@/server/project-files');
  await ensureDefaultFiles(project.id);
  return NextResponse.json({ project });
}
