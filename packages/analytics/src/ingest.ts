import type { PrismaClient } from '@amable/db';

export async function recordPageview(
  prisma: PrismaClient,
  params: {
    projectId: string;
    path: string;
    referrer?: string;
    userAgent?: string;
    sessionId: string;
  }
) {
  const ua = params.userAgent ?? '';
  const device = /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';
  await prisma.analyticsEvent.create({
    data: {
      projectId: params.projectId,
      path: params.path,
      referrer: params.referrer,
      userAgent: params.userAgent,
      device,
      country: 'ES',
      sessionId: params.sessionId,
    },
  });
}
