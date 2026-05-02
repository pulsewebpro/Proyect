import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@amable/db';
import { recordPageview } from '@amable/analytics';

const schema = z.object({
  slug: z.string(),
  path: z.string().default('/'),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().min(8),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'inválido' }, { status: 400 });
  const pub = await prisma.publication.findFirst({
    where: { slug: parsed.data.slug, status: 'live' },
  });
  if (!pub) return NextResponse.json({ error: 'no publicado' }, { status: 404 });
  await recordPageview(prisma, {
    projectId: pub.projectId,
    path: parsed.data.path,
    referrer: parsed.data.referrer,
    userAgent: parsed.data.userAgent ?? req.headers.get('user-agent') ?? undefined,
    sessionId: parsed.data.sessionId,
  });
  return NextResponse.json({ ok: true });
}
