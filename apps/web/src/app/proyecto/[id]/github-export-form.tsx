'use client';

import { useState } from 'react';
import { Button, Input } from '@amable/ui';

export function GithubExportForm({ projectId }: { projectId: string }) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/v1/projects/${projectId}/github/export`, {
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
    setMsg(`Commit ${j.commitSha?.slice(0, 7)} en ${owner}/${repo}@${branch}`);
  }

  return (
    <div className="space-y-2 border-t border-white/10 pt-4">
      <div className="font-medium">Exportar a GitHub (commit real)</div>
      <p className="text-xs text-muted">
        Crea un commit sobre la rama existente con todos los <code className="text-fg">ProjectFile</code>. Requiere PAT
        con <code className="text-fg">repo</code>. No hace merge ni PR.
      </p>
      <Input placeholder="owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
      <Input placeholder="repo" value={repo} onChange={(e) => setRepo(e.target.value)} />
      <Input placeholder="rama" value={branch} onChange={(e) => setBranch(e.target.value)} />
      <Input type="password" placeholder="PAT (o GITHUB_IMPORT_TOKEN en servidor)" value={token} onChange={(e) => setToken(e.target.value)} />
      <Button type="button" disabled={loading || !owner || !repo} onClick={() => void submit()}>
        Push commit
      </Button>
      {msg ? <p className="text-xs text-muted">{msg}</p> : null}
    </div>
  );
}
