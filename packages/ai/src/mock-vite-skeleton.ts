/**
 * Deterministic Vite-shaped file set for local mock builds (no LLM keys).
 * Keeps preview and publish on the same Vite pipeline as real LLM output.
 */
export function mockViteProjectFiles(promptSnippet: string): { path: string; content: string }[] {
  const safeSnippet = promptSnippet.slice(0, 200);
  const pkg = {
    name: 'amable-generated-mock',
    private: true,
    type: 'module',
    scripts: { build: 'vite build', dev: 'vite' },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
    },
    devDependencies: {
      vite: '^6.0.11',
      '@vitejs/plugin-react': '^4.3.4',
      typescript: '^5.7.2',
    },
  };

  return [
    { path: 'package.json', content: `${JSON.stringify(pkg, null, 2)}\n` },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({ plugins: [react()] });\n`,
    },
    {
      path: 'index.html',
      content: `<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>App generada (mock local)</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
    },
    {
      path: 'src/main.tsx',
      content: `import { StrictMode } from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n`,
    },
    {
      path: 'src/App.tsx',
      content: `import { useEffect, useState } from 'react';\n\nconst USER_PROMPT_SNIPPET = ${JSON.stringify(safeSnippet)};\n\nexport default function App() {\n  const [rows, setRows] = useState<{ id: string }[]>([]);\n  const [err, setErr] = useState<string | null>(null);\n\n  useEffect(() => {\n    let cancelled = false;\n    void (async () => {\n      try {\n        const r = await fetch('/api/app/Booking');\n        const j = (await r.json()) as { items?: { id: string }[]; error?: string };\n        if (!r.ok) throw new Error(j.error ?? r.statusText);\n        if (!cancelled) setRows(j.items ?? []);\n      } catch (e) {\n        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));\n      }\n    })();\n    return () => {\n      cancelled = true;\n    };\n  }, []);\n\n  return (\n    <main data-testid="e2e-generated-root" style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 720 }}>\n      <h1>Amable Studio (demo generada)</h1>\n      <p data-testid="e2e-prompt-snippet">{USER_PROMPT_SNIPPET || '(sin texto)'}</p>\n      <section aria-label="Reservas de ejemplo">\n        <h2 style={{ fontSize: '1.1rem', marginTop: 24 }}>Reservas (API generada)</h2>\n        {err ? (\n          <p style={{ color: '#f87171' }}>{err}</p>\n        ) : (\n          <ul>\n            {rows.map((x) => (\n              <li key={x.id}>{x.id}</li>\n            ))}\n          </ul>\n        )}\n      </section>\n    </main>\n  );\n}\n`,
    },
  ];
}
