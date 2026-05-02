import { cookies } from 'next/headers';
import { verifySession } from '@amable/auth';
import { prisma } from '@amable/db';
import { SESSION_COOKIE_NAME } from './cookies';

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, username: true },
  });
  return user;
}
