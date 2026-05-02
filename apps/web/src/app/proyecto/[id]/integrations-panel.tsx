'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@amable/ui';

type Row = { type: string; enabled: boolean; hasSecrets: boolean };

export function IntegrationsPanel({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch(`/api/v1/projects/${projectId}/integrations`);
    const j = await res.json();
    setRows(j.integrations ?? []);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(type: string, enabled: boolean) {
    await fetch(`/api/v1/projects/${projectId}/integrations`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, enabled }),
    });
    void load();
  }

  async function saveSecrets(type: string) {
    const raw = secretInputs[type]?.trim();
    if (!raw) return;
    let secrets: Record<string, string> = { value: raw };
    try {
      secrets = JSON.parse(raw) as Record<string, string>;
    } catch {
      /* plain string */
    }
    await fetch(`/api/v1/projects/${projectId}/integrations`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, secrets }),
    });
    setSecretInputs((s) => ({ ...s, [type]: '' }));
    void load();
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-muted">
        Catálogo mínimo: credenciales en JSON cifrado en reposo no implementado; se almacenan como JSON en BD (solo
        entornos controlados).
      </p>
      {rows.map((r) => (
        <div key={r.type} className="rounded-md border border-white/10 bg-panel p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{r.type}</span>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={r.enabled} onChange={(e) => void toggle(r.type, e.target.checked)} />
              Activa
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="secret JSON o texto"
              value={secretInputs[r.type] ?? ''}
              onChange={(e) => setSecretInputs((s) => ({ ...s, [r.type]: e.target.value }))}
              className="flex-1"
            />
            <Button type="button" size="sm" variant="secondary" onClick={() => void saveSecrets(r.type)}>
              Guardar
            </Button>
          </div>
          {r.hasSecrets ? <p className="mt-1 text-xs text-muted">Tiene secretos guardados</p> : null}
        </div>
      ))}
    </div>
  );
}
