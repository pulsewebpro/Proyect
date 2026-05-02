'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button, Card, CardContent, Input } from '@amable/ui';

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const initial = sp.get('prompt') ?? '';
  const auto = sp.get('auto') === '1';
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(initial);
  const [slug, setSlug] = useState('desde-url');
  const [name, setName] = useState('Proyecto desde URL');

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/v1/workspaces');
      if (res.status === 401) {
        router.push(`/iniciar-sesion?next=${encodeURIComponent('/construir-desde-url')}`);
        return;
      }
      const data = await res.json();
      setWorkspaceId(data.workspaces[0]?.id ?? null);
    })();
  }, [router]);

  useEffect(() => {
    if (auto && workspaceId && prompt) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, workspaceId]);

  async function submit() {
    if (!workspaceId) return;
    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name, slug }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const runRes = await fetch(`/api/v1/projects/${data.project.id}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'build', prompt }),
    });
    if (!runRes.ok) return;
    router.push(`/proyecto/${data.project.id}`);
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-semibold">Construir desde URL</h1>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} />
          <textarea
            className="min-h-28 w-full rounded-[var(--radius)] border border-white/10 bg-panel px-3 py-2 text-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button type="button" onClick={() => void submit()} disabled={!workspaceId}>
            Crear y ejecutar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BuildFromUrlPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Cargando…</div>}>
      <Inner />
    </Suspense>
  );
}
