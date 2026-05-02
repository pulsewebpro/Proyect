import * as esbuild from 'esbuild';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

/**
 * Bundles `src/App.tsx` (TSX) into a single IIFE for browser preview/publish.
 * React is bundled in (no CDN). User code must `export default` a component.
 */
export async function bundleAppForPreview(appSource: string): Promise<{ js: string; errors: string[] }> {
  const resolveDir = path.dirname(require.resolve('react/package.json'));

  const entry = `
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from 'virtual:user-app';

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
`;

  try {
    const result = await esbuild.build({
      stdin: {
        contents: entry,
        loader: 'tsx',
        resolveDir,
      },
      plugins: [
        {
          name: 'virtual-user-app',
          setup(build) {
            build.onResolve({ filter: /^virtual:user-app$/ }, () => ({
              path: 'virtual:user-app',
              namespace: 'userapp',
            }));
            build.onLoad({ filter: /.*/, namespace: 'userapp' }, () => ({
              contents: appSource,
              loader: 'tsx',
              resolveDir,
            }));
          },
        },
      ],
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'automatic',
      logLevel: 'silent',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });
    const file = result.outputFiles?.[0];
    if (!file) return { js: '', errors: ['Sin salida de esbuild'] };
    let js = file.text;
    js = js.replace(/<\/script/gi, '<\\/script');
    return { js, errors: [] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { js: '', errors: [msg] };
  }
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
