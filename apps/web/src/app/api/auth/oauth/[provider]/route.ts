import { NextResponse, type NextRequest } from 'next/server';

const baseUrl = () => process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (provider !== 'github' && provider !== 'google') {
    return NextResponse.json({ error: 'Proveedor no soportado' }, { status: 400 });
  }
  const state = crypto.randomUUID();
  let target: string;
  try {
    target = provider === 'github' ? githubAuthUrl(state) : googleAuthUrl(state);
  } catch {
    return NextResponse.redirect(`${baseUrl()}/iniciar-sesion?error=oauth_not_configured`);
  }
  const res = NextResponse.redirect(target, 302);
  res.cookies.set(`oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}

function githubAuthUrl(state: string): string {
  const id = process.env.GITHUB_CLIENT_ID;
  if (!id) throw new Error('missing');
  const u = new URL('https://github.com/login/oauth/authorize');
  u.searchParams.set('client_id', id);
  u.searchParams.set('redirect_uri', `${baseUrl()}/api/auth/callback/github`);
  u.searchParams.set('scope', 'read:user user:email');
  u.searchParams.set('state', state);
  return u.toString();
}

function googleAuthUrl(state: string): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error('missing');
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', id);
  u.searchParams.set('redirect_uri', `${baseUrl()}/api/auth/callback/google`);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', 'openid email profile');
  u.searchParams.set('state', state);
  u.searchParams.set('access_type', 'offline');
  u.searchParams.set('prompt', 'consent');
  return u.toString();
}
