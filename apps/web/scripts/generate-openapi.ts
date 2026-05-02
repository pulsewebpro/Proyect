import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, '..', '..', 'docs', 'screens');
mkdirSync(outDir, { recursive: true });

const spec = {
  openapi: '3.1.0',
  info: { title: 'Amable Studio API', version: '1.0.0' },
  paths: {
    '/api/v1/me': { get: { summary: 'Usuario actual' } },
    '/api/v1/workspaces': { get: { summary: 'Listar workspaces' } },
    '/api/v1/projects': {
      get: { summary: 'Listar proyectos' },
      post: { summary: 'Crear proyecto' },
    },
    '/api/v1/projects/{id}/runs': { post: { summary: 'Crear run' } },
    '/api/v1/projects/{id}/runs/{runId}/stream': { get: { summary: 'SSE estado run' } },
    '/api/v1/projects/{id}/publish': { post: { summary: 'Publicar' } },
    '/api/public/analytics': { post: { summary: 'Beacon analítica pública' } },
  },
};

const out = join(root, 'public', 'openapi.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(spec, null, 2));
writeFileSync(join(outDir, 'openapi.json'), JSON.stringify(spec, null, 2));
console.log('OpenAPI escrito en', out);
