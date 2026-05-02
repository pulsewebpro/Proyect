import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@amable/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const ok = await prisma.project.findFirst({
    where: { id: projectId, workspace: { members: { some: { userId: user.id } } } },
  });
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '7d';
  const days = range === 'today' ? 1 : range === '30d' ? 30 : 7;
  const since = new Date(Date.now() - days * 86400000);
  const events = await prisma.analyticsEvent.findMany({
    where: { projectId, createdAt: { gte: since } },
  });
  const visitors = new Set(events.map((e) => e.sessionId)).size;
  const pageviews = events.length;
  const bounceRate = pageviews ? Math.min(1, visitors / pageviews) : 0;
  const avgDuration =
    events.length > 0
      ? events.reduce((a, e) => a + (e.durationMs ?? 0), 0) / events.length / 1000
      : 0;
  const sources: Record<string, number> = {};
  for (const e of events) {
    const k = e.referrer || 'directo';
    sources[k] = (sources[k] ?? 0) + 1;
  }
  const devices: Record<string, number> = {};
  for (const e of events) {
    const k = e.device ?? 'desconocido';
    devices[k] = (devices[k] ?? 0) + 1;
  }
  return NextResponse.json({
    range,
    metrics: {
      visitors,
      pageviews,
      bounceRate,
      avgDuration,
    },
    sources,
    devices,
  });
}
