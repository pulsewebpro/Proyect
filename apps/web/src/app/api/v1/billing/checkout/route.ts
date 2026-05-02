import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createCheckoutSession } from '@amable/billing';
import { z } from 'zod';

const bodySchema = z.object({
  priceId: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const base = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await createCheckoutSession({
    priceId: parsed.data.priceId,
    successUrl: `${base}/dashboard?checkout=ok`,
    cancelUrl: `${base}/dashboard?checkout=cancel`,
  });
  if ('error' in res) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ url: res.url });
}
