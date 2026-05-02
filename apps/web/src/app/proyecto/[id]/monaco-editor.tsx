'use client';

import MonacoEditorBase from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { Button } from '@amable/ui';

export default function MonacoEditor(props: { path: string; value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(props.value);
  useEffect(() => {
    setDraft(props.value);
  }, [props.value, props.path]);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-white/10 px-2 py-1">
        <Button size="sm" type="button" variant="secondary" onClick={() => props.onSave(draft)}>
          Guardar
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <MonacoEditorBase
          height="100%"
          theme="vs-dark"
          path={props.path}
          defaultLanguage="typescript"
          value={draft}
          onChange={(v: string | undefined) => setDraft(v ?? '')}
          options={{ minimap: { enabled: false }, fontSize: 13 }}
        />
      </div>
    </div>
  );
}
