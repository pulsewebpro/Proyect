# Arquitectura

## Vista general

La aplicación separa el **plano de control** (usuarios, workspaces, proyectos, runs, facturación) del **runtime de apps generadas** (archivos en Postgres, `GeneratedRow`, `GeneratedAppUser`, API `/api/app/*`, preview/publicación **esbuild** o **Vite** si el proyecto declara `vite`).

- **apps/web**: Next.js 15; `/api/v1/*`, `/api/app/*`, `/api/public/*`; JWT en cookies (`jose`); middleware en `/dashboard` y `/proyecto`.
- **apps/worker**: BullMQ → `@amable/jobs` → `processRun`.
- **packages/db**: Prisma; modelos clave: `ProjectProductSpec`, `GeneratedRow`, `GeneratedAppUser`, `ProjectIntegration`, `Publication.viteContentHash`.
- **packages/jobs**: `processRun` + `createRunStream` (`@amable/ai`).
- **packages/ai**: OpenAI/Anthropic, Zod, mock solo en local sin keys.
- **packages/credits**: Serializable + reintentos `P2034`.

## Flujo de un run

1. `POST /api/v1/projects/:id/runs` encola o ejecuta `processRun`.
2. `createRunStream`: keys → LLM; sin keys y no producción → mock; sin keys y producción → error.
3. Plan → `ProjectProductSpec` + demo rows + integraciones mencionadas.
4. Build → `ProjectFile` (files + diffs legacy).
5. SSE: polling en `GET .../stream`.

## Preview y publicación

- **Puerta opcional:** `runSecurityCheck` → `runPublishPackageJsonGate` (heurística `package.json`, no CVE).
- **Vite** (si hay `vite` en `package.json` y no `AMABLE_SKIP_VITE`): build en temp, dist en `${TMPDIR}/amable-vite-store/:projectId/:hash`; `Publication.viteContentHash`.
- **esbuild** si no Vite o con `AMABLE_SKIP_VITE=1`: bundle IIFE.
- `GET /api/public/sitio/:slug/frame`: sirve Vite si hay hash persistido; si no, esbuild. Fallo de compilación → **503** texto plano (no HTML “éxito” con error).
- Analítica: `POST /api/public/analytics` → `AnalyticsEvent` (país `null`).

## API app generada

- Contexto por header **Referer** (`/proyecto/:id` o `/sitio/:slug` con publicación `live`).
- Cookie `amable_app_session` para usuarios de la app generada (mismo `AUTH_SECRET` que la plataforma; claims distintos de `amable_session`).

## Seguridad

- Cookies HttpOnly; `Secure` en producción.
- Heurística pre-publicación: no sustituye SAST/CVE.
- Secretos de integraciones en BD como JSON: **sin cifrado** en esta versión.

## Limitaciones de escalado

- SSE runs: polling DB ~500 ms.
- Vite: `npm install` + build por publicación/preview puede ser costoso en CPU y tiempo.
