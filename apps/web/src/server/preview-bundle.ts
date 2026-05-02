import * as esbuild from 'esbuild';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);

function normalizeRel(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/+/, '');
}

/**
 * Real multi-file browser bundle: writes sources to a temp dir, runs esbuild once, deletes tree.
 * Resolves all normal relative/absolute imports between project files.
 */
export async function bundleProjectFiles(
  files: { path: string; content: string }[]
): Promise<{ js: string; errors: string[] }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'amable-bundle-'));
  try {
    for (const f of files) {
      const ext = f.path.split('.').pop()?.toLowerCase();
      if (!ext || !['ts', 'tsx', 'js', 'jsx'].includes(ext)) continue;
      const rel = normalizeRel(f.path);
      const full = path.join(dir, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, f.content, 'utf8');
    }

    const candidates = ['src/App.tsx', 'src/App.ts', 'src/App.jsx', 'src/App.js', 'App.tsx'];
    let entryFile: string | null = null;
    for (const c of candidates) {
      const full = path.join(dir, c);
      try {
        await fs.access(full);
        entryFile = full;
        break;
      } catch {
        /* */
      }
    }
    if (!entryFile) {
      return { js: '', errors: ['No se encontró src/App.tsx (ni variantes) en el proyecto.'] };
    }

    const shim = path.join(dir, '__amable_mount.tsx');
    const relEntry = './' + path.relative(dir, entryFile).split(path.sep).join('/');
    await fs.writeFile(
      shim,
      `
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from ${JSON.stringify(relEntry)};

const mount = () => {
  const el = document.getElementById('root');
  if (!el) return;
  const root = ReactDOM.createRoot(el);
  root.render(React.createElement(App));
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
`,
      'utf8'
    );

    const resolveReact: esbuild.Plugin = {
      name: 'resolve-react-from-host',
      setup(build) {
        const map: [RegExp, string][] = [
          [/^react$/, require.resolve('react')],
          [/^react\/jsx-runtime$/, require.resolve('react/jsx-runtime')],
          [/^react\/jsx-dev-runtime$/, require.resolve('react/jsx-dev-runtime')],
          [/^react-dom$/, require.resolve('react-dom')],
          [/^react-dom\/client$/, require.resolve('react-dom/client')],
        ];
        for (const [re, p] of map) {
          build.onResolve({ filter: re }, () => ({ path: p }));
        }
      },
    };

    const result = await esbuild.build({
      entryPoints: [shim],
      absWorkingDir: dir,
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'automatic',
      logLevel: 'silent',
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [resolveReact],
    });

    const file = result.outputFiles?.[0];
    if (!file) return { js: '', errors: ['Sin salida de esbuild'] };
    let js = file.text;
    js = js.replace(/<\/script/gi, '<\\/script');
    return { js, errors: [] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { js: '', errors: [msg] };
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function bundleAppForPreview(appSource: string): Promise<{ js: string; errors: string[] }> {
  return bundleProjectFiles([{ path: 'src/App.tsx', content: appSource }]);
}

export function previewShellHtml(embeddedScript: string, title: string): string {
  const safeTitle = title.replace(/</g, '').slice(0, 120);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${safeTitle}</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: https: blob:; font-src data:; connect-src 'self' https: http:; base-uri 'none'; form-action 'none'"/>
  <style>
    html,body,#root{height:100%;margin:0}
    body{font-family:system-ui,sans-serif;background:#0f0f0f;color:#f6f3ed}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>${embeddedScript}</script>
</body>
</html>`;
}
