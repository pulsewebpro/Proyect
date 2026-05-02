import { prisma } from '@amable/db';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ slug: string }> };

export default async function PublishedSite({ params }: Props) {
  const { slug } = await params;
  const pub = await prisma.publication.findFirst({
    where: { slug, status: 'live' },
    include: { project: true },
  });
  if (!pub) notFound();

  const frameSrc = `/api/public/sitio/${encodeURIComponent(slug)}/frame`;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-white/10 px-4 py-3">
        <h1 className="text-lg font-semibold">{pub.project.name}</h1>
        <p className="text-xs text-muted">Publicación en vivo (runtime compilado)</p>
      </header>
      <iframe
        title="Aplicación publicada"
        className="h-[calc(100dvh-52px)] w-full border-0 bg-[#0f0f0f]"
        src={frameSrc}
        sandbox="allow-scripts allow-same-origin"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  var sessionId = localStorage.getItem('amable_session') || (function(){
    var id = Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
    localStorage.setItem('amable_session', id);
    return id;
  })();
  fetch('/api/public/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug: ${JSON.stringify(slug)},
      path: location.pathname,
      referrer: document.referrer || null,
      sessionId: sessionId
    })
  }).catch(function(){});
})();`,
        }}
      />
    </div>
  );
}
