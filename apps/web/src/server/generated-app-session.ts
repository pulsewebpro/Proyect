import { cookies } from 'next/headers';
import { verifySession } from '@amable/auth';
import { prisma } from '@amable/db';
import { APP_SESSION_COOKIE_NAME } from '@/lib/cookies';

export type GeneratedAppCtx = {
  userId: string;
  email: string;
  role: string;
  projectId: string;
};

export async function getGeneratedAppUser(projectId: string): Promise<GeneratedAppCtx | null> {
  const jar = await cookies();
  const tok = jar.get(APP_SESSION_COOKIE_NAME)?.value;
  if (!tok) return null;
  const session = await verifySession(tok);
  if (!session) return null;
  const user = await prisma.generatedAppUser.findFirst({
    where: { id: session.sub, projectId },
  });
  if (!user) return null;
  return { userId: user.id, email: user.email, role: user.role, projectId };
}
