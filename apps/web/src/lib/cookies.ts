const COOKIE = 'amable_session';

export function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}

export const SESSION_COOKIE_NAME = COOKIE;
