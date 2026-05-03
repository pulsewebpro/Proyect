import { NextResponse } from 'next/server';
import { prisma } from '@amable/db';
import { hashPassword, verifyPassword, signSession, verifySession } from '@amable/auth';
import { z } from 'zod';
import { resolveProjectIdForGeneratedApi } from '@/server/generated-api-context';
import { cookies } from 'next/headers';
import { APP_SESSION_COOKIE_NAME } from '@/lib/cookies';

const APP_SESSION = APP_SESSION_COOKIE_NAME;

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const projectId = await resolveProjectIdForGeneratedApi(req);
  if (!projectId) return NextResponse.json({ error: 'contexto_requerido' }, { status: 400 });

  if (action === 'register') {
    const body = await req.json().catch(() => null);
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8).max(128),
      role: z.enum(['user', 'admin']).optional().default('user'),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const exists = await prisma.generatedAppUser.findUnique({
      where: { projectId_email: { projectId, email: parsed.data.email } },
    });
    if (exists) return NextResponse.json({ error: 'email_en_uso' }, { status: 409 });
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.generatedAppUser.create({
      data: {
        projectId,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      },
    });
    const token = await signSession({ sub: user.id, email: user.email });
    const jar = await cookies();
    jar.set(APP_SESSION, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
      secure: process.env.NODE_ENV === 'production',
    });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  }

  if (action === 'login') {
    const body = await req.json().catch(() => null);
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const user = await prisma.generatedAppUser.findUnique({
      where: { projectId_email: { projectId, email: parsed.data.email } },
    });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: 'credenciales_inválidas' }, { status: 401 });
    }
    const token = await signSession({ sub: user.id, email: user.email });
    const jar = await cookies();
    jar.set(APP_SESSION, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
      secure: process.env.NODE_ENV === 'production',
    });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  }

  if (action === 'logout') {
    const jar = await cookies();
    jar.delete(APP_SESSION);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'acción_desconocida' }, { status: 404 });
}

export async function GET(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  if (action !== 'me') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const projectId = await resolveProjectIdForGeneratedApi(req);
  if (!projectId) return NextResponse.json({ error: 'contexto_requerido' }, { status: 400 });
  const jar = await cookies();
  const tok = jar.get(APP_SESSION)?.value;
  if (!tok) return NextResponse.json({ user: null });
  const session = await verifySession(tok);
  if (!session) return NextResponse.json({ user: null });
  const user = await prisma.generatedAppUser.findFirst({
    where: { id: session.sub, projectId },
  });
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } });
}
