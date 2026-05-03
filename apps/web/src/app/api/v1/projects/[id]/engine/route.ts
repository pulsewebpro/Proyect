import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';
import { getProductEngineStateForProject } from '@/server/product-engine-query';

type Ctx = { params: Promise<{ id: string }> };

/** Definitive product state: same tree for preview and publish, runs, credits on project, live publication. */
export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;

  const ok = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { workspace: { members: { some: { userId: user.id } } } },
        { members: { some: { userId: user.id } } },
      ],
    },
    select: { id: true },
  });
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  try {
    const state = await getProductEngineStateForProject(projectId);
    return NextResponse.json(state);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error';
    if (msg === 'project_not_found') {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'engine_error' }, { status: 500 });
  }
}
