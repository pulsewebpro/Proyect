import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@amable/db';
import { verifyOpsCookieValue, OPS_COOKIE_NAME } from '@/lib/ops-session';
import { getRedis } from '@/lib/queue';

export async function GET() {
  const jar = await cookies();
  const tok = jar.get(OPS_COOKIE_NAME)?.value;
  if (!tok || !(await verifyOpsCookieValue(tok))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const [users, projects, runs24, pubsLive] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.run.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
    prisma.publication.count({ where: { status: 'live' } }),
  ]);

  let redis = 'not_configured';
  if (process.env.REDIS_URL?.trim()) {
    try {
      await getRedis().ping();
      redis = 'ok';
    } catch {
      redis = 'error';
    }
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    counts: { users, projects, runsLast24h: runs24, publicationsLive: pubsLive },
    redis,
    llm: {
      openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    },
    email: Boolean(process.env.RESEND_API_KEY?.trim()),
  });
}
