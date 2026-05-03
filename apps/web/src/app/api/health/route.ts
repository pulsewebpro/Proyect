import { NextResponse } from 'next/server';
import { prisma } from '@amable/db';
import { getRedis } from '@/lib/queue';

export async function GET() {
  let db: 'ok' | 'error' = 'error';
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'ok';
  } catch {
    db = 'error';
  }
  let redis: 'ok' | 'error' | 'not_configured' = 'not_configured';
  if (process.env.REDIS_URL?.trim()) {
    try {
      await getRedis().ping();
      redis = 'ok';
    } catch {
      redis = 'error';
    }
  }
  const llmConfigured = Boolean(
    process.env.OPENAI_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim()
  );
  const strict = process.env.HEALTH_STRICT === '1';
  const degraded = db !== 'ok' || (strict && (!llmConfigured || redis === 'error'));
  return NextResponse.json(
    {
      status: degraded ? 'unhealthy' : 'ok',
      checks: { database: db, redis, llmKeys: llmConfigured },
    },
    { status: db === 'ok' && (!strict || (llmConfigured && redis !== 'error')) ? 200 : 503 }
  );
}
