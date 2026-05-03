import { SignJWT, jwtVerify } from 'jose';

const COOKIE = 'amable_ops';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('AUTH_SECRET must be set (min 16 chars)');
  }
  return new TextEncoder().encode(secret);
}

export async function signOpsCookieValue(): Promise<string> {
  return new SignJWT({ ops: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('operations')
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getSecret());
}

export async function verifyOpsCookieValue(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.ops === true && payload.sub === 'operations';
  } catch {
    return false;
  }
}

export const OPS_COOKIE_NAME = COOKIE;

export function opsCookieOptions() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 60 * 60 * 12,
  };
}
