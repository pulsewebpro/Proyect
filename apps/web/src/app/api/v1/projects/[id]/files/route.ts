import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { z } from 'zod';

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: { members: { some: { userId: user.id } } },
    },
  });
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const files = await prisma.projectFile.findMany({ where: { projectId }, orderBy: { path: 'asc' } });
  return NextResponse.json({ files });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const member = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspace: { projects: { some: { id: projectId } } } },
  });
  if (!member || member.role === 'viewer') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const { path, content } = parsed.data;
  const hash = simpleHash(content);
  const file = await prisma.projectFile.upsert({
    where: { projectId_path: { projectId, path } },
    create: {
      projectId,
      path,
      content,
      hash,
      size: Buffer.byteLength(content, 'utf8'),
    },
    update: { content, hash, size: Buffer.byteLength(content, 'utf8') },
  });
  return NextResponse.json({ file });
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(16)}`;
}
