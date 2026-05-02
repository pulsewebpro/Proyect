'use client';

import { useState } from 'react';
import { Button, Input } from '@amable/ui';

export function GithubImportForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/v1/projects/${projectId}/github/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo, branch, token: token || undefined }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(typeof j.details === 'string' ? j.details : j.error ?? 'Error');
      return;
    }
    setMsg(`Importados: ${j.imported} archivos`);
    onDone();
  }

  return (
    <div className="space-y-2">
      <Input placeholder="owner (ej. vercel)" value={owner} onChange={(e) => setOwner(e.target.value)} />
      <Input placeholder="repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
      <Input placeholder="rama" value={branch} onChange={(e) => setBranch(e.target.value)} />
      <Input type="password" placeholder="Token GitHub (opcional; público sin token)" value={token} onChange={(e) => setToken(e.target.value)} />
      <Button type="button" disabled={loading || !owner || !repo} onClick={() => void submit()}>
        Importar
      </Button>
      {msg ? <p className="text-xs text-muted">{msg}</p> : null}
    </div>
  );
}
