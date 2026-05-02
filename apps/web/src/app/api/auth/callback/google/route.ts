import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@amable/db';
import { IdentityProvider } from '@prisma/client';
import { signSession } from '@amable/auth/session';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/cookies';
import { ensureUserHasWorkspace } from '@/server/oauth-post-login';

const baseUrl = () => process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const want = cookieStore.get('oauth_state_google')?.value;
  if (!code || !state || state !== want) {
    return NextResponse.redirect(`${baseUrl()}/iniciar-sesion?error=oauth_state`);
  }
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) {
    return NextResponse.redirect(`${baseUrl()}/iniciar-sesion?error=oauth_not_configured`);
  }
  const body = new URLSearchParams({
    code,
    client_id: id,
    client_secret: secret,
    redirect_uri: `${baseUrl()}/api/auth/callback/google`,
    grant_type: 'authorization_code',
  });
  const tokRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const tokJson = (await tokRes.json()) as { access_token?: string; error?: string };
  if (!tokJson.access_token) {
    return NextResponse.redirect(`${baseUrl()}/iniciar-sesion?error=oauth_token`);
  }
  const ui = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokJson.access_token}` },
  }).then((r) => r.json() as Promise<{ sub: string; email: string; name?: string }>);

  const sub = ui.sub;
  const email = ui.email;
  let user = await prisma.user.findFirst({
    where: { identities: { some: { provider: IdentityProvider.google, providerUserId: sub } } },
  });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      await prisma.identity.create({
        data: { userId: byEmail.id, provider: IdentityProvider.google, providerUserId: sub, emailVerified: true },
      });
      user = byEmail;
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: ui.name ?? email.split('@')[0],
          identities: {
            create: { provider: IdentityProvider.google, providerUserId: sub, emailVerified: true },
          },
          preferences: { create: {} },
        },
      });
    }
  }
  await ensureUserHasWorkspace(user.id);
  const token = await signSession({ sub: user.id, email: user.email });
  cookieStore.delete('oauth_state_google');
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return NextResponse.redirect(`${baseUrl()}/dashboard`);
}
