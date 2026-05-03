'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@amable/ui';

type Metrics = {
  generatedAt: string;
  counts: { users: number; projects: number; runsLast24h: number; publicationsLive: number };
  redis: string;
  llm: { openai: boolean; anthropic: boolean };
  email: boolean;
};

export default function AdminOpsPage() {
  const [secret, setSecret] = useState('');
  const [logged, setLogged] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetch('/api/admin/metrics');
    if (r.status === 401) {
      setLogged(false);
      setMetrics(null);
      return;
    }
    const j = await r.json();
    setMetrics(j);
    setLogged(true);
  }, []);

  useEffect(() => {
    void (async () => {
      const s = await fetch('/api/admin/ops-session');
      const j = await s.json();
      if (j.ok) void refresh();
    })();
  }, [refresh]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await fetch('/api/admin/ops-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError((j.error as string) ?? 'Error');
      return;
    }
    setSecret('');
    await refresh();
  }

  async function logout() {
    await fetch('/api/admin/ops-session', { method: 'DELETE' });
    setLogged(false);
    setMetrics(null);
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <p className="mb-6 text-sm text-muted">
        <Link href="/" className="text-accent-6 underline">
          Inicio
        </Link>
      </p>
      {!logged ? (
        <Card>
          <CardHeader>
            <CardTitle>Acceso operaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={login}>
              <p className="text-xs text-muted">
                Usa el valor de <code className="text-fg">OPERATIONS_SECRET</code> en el servidor.
              </p>
              <Input
                type="password"
                autoComplete="off"
                placeholder="OPERATIONS_SECRET"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              {error ? <p className="text-sm text-accent-2">{error}</p> : null}
              <Button type="submit">Entrar</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Métricas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Button variant="secondary" type="button" onClick={() => void refresh()}>
              Actualizar
            </Button>
            <Button variant="ghost" type="button" onClick={() => void logout()}>
              Salir
            </Button>
            {metrics ? (
              <pre className="overflow-auto rounded-md border border-white/10 bg-panel p-3 text-xs text-muted">
                {JSON.stringify(metrics, null, 2)}
              </pre>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
