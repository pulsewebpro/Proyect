import { prisma } from '@amable/db';

export async function resolveProjectIdForGeneratedApi(req: Request): Promise<string | null> {
  const ref = req.headers.get('referer') ?? '';
  if (!ref) return null;
  try {
    const u = new URL(ref);
    const sitio = u.pathname.match(/^\/sitio\/([^/]+)/);
    if (sitio?.[1]) {
      const pub = await prisma.publication.findFirst({
        where: { slug: sitio[1], status: 'live' },
        select: { projectId: true },
      });
      return pub?.projectId ?? null;
    }
    const proj = u.pathname.match(/^\/proyecto\/([^/]+)/);
    return proj?.[1] ?? null;
  } catch {
    return null;
  }
}
