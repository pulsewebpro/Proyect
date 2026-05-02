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
  const publication = pub;
  const appFile = await prisma.projectFile.findFirst({
    where: { projectId: publication.projectId, path: 'src/App.tsx' },
  });
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">{publication.project.name}</h1>
        <p className="mt-2 text-muted">Publicación en vivo (vista simplificada).</p>
        <pre className="mt-6 overflow-auto rounded-[var(--radius)] border border-white/10 bg-panel p-4 text-sm">
          {appFile?.content ?? '// sin App.tsx'}
        </pre>
      </div>
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
