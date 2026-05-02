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
  const want = cookieStore.get('oauth_state_github')?.value;
  if (!code || !state || state !== want) {
    return NextResponse.redirect(`${baseUrl()}/iniciar-sesion?error=oauth_state`);
  }
  const id = process.env.GITHUB_CLIENT_ID;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!id || !secret) {
    return NextResponse.redirect(`${baseUrl()}/iniciar-sesion?error=oauth_not_configured`);
  }
  const tokRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: id, client_secret: secret, code }),
  });
  const tokJson = (await tokRes.json()) as { access_token?: string; error?: string };
  if (!tokJson.access_token) {
    return NextResponse.redirect(`${baseUrl()}/iniciar-sesion?error=oauth_token`);
  }
  const uRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokJson.access_token}`, Accept: 'application/json' },
  });
  const gh = (await uRes.json()) as { id: number; email?: string | null; name?: string | null; login: string };
  const email =
    gh.email ??
    (await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokJson.access_token}`, Accept: 'application/json' },
    })
      .then((r) => r.json() as Promise<{ email: string; primary: boolean }[]>)
      .then((arr) => arr.find((e) => e.primary)?.email ?? arr[0]?.email)) ??
    `${gh.login}@users.noreply.github.com`;
  const sub = String(gh.id);

  let user = await prisma.user.findFirst({
    where: { identities: { some: { provider: IdentityProvider.github, providerUserId: sub } } },
  });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      await prisma.identity.create({
        data: { userId: byEmail.id, provider: IdentityProvider.github, providerUserId: sub, emailVerified: true },
      });
      user = byEmail;
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: gh.name ?? gh.login,
          identities: {
            create: { provider: IdentityProvider.github, providerUserId: sub, emailVerified: true },
          },
          preferences: { create: {} },
        },
      });
    }
  }
  await ensureUserHasWorkspace(user.id);
  const token = await signSession({ sub: user.id, email: user.email });
  cookieStore.delete('oauth_state_github');
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return NextResponse.redirect(`${baseUrl()}/dashboard`);
}
