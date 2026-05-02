# Arquitectura

## Vista general

La aplicación separa el **plano de control** (usuarios, workspaces, proyectos, runs, facturación) del **runtime de apps generadas** (archivos en Postgres, datos lógicos `GeneratedRow`, usuarios finales `GeneratedAppUser`, API `/api/app/*`, preview/publicación esbuild o **Vite build** si el proyecto declara `vite`).

- **apps/web**: Next.js 15, `/api/v1/*`, `/api/app/*` (app generada), `/api/public/*`, cookies JWT (`jose`), middleware en `/dashboard` y `/proyecto`.
- **apps/worker**: BullMQ → `@amable/jobs` → `processRun`.
- **packages/db**: Prisma; modelos nuevos: `ProjectProductSpec`, `GeneratedRow`, `GeneratedAppUser`, `ProjectIntegration`, `Publication.viteContentHash`.
- **packages/jobs**: `processRun` consume `createRunStream` de `@amable/ai` (LLM o mock local).
- **packages/ai**: `createRunStream`, clientes OpenAI/Anthropic, schemas Zod (`productSpecSchema`, `llmBuildOutputSchema`), `mockRunStream` solo desarrollo sin keys.
- **packages/credits**: Serializable + reintentos `P2034`.

## Flujo de un run

1. `POST /api/v1/projects/:id/runs` encola o ejecuta `processRun`.
2. `createRunStream`: si hay `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` → LLM; si no y no es producción → mock; si no y producción → error.
3. Plan: mensaje assistant con JSON → `parsePlanMessageForSpec` → `ProjectProductSpec` + `GeneratedRow` demo + `ProjectIntegration` upserts.
4. Build: JSON con `files[]` → upsert `ProjectFile`; soporta eventos legacy `diff` (append).
5. SSE: mismo mecanismo de polling en `GET .../stream`.

## Preview y publicación

- **Vite** (si `package.json` tiene `vite`): `buildViteProjectIfApplicable` escribe temp, `npm install`, `vite build`, copia `dist` a `${TMPDIR}/amable-vite-store/:projectId/:hash/dist`. `GET preview-frame` reescribe rutas de assets. `POST publish` valida build Vite y guarda `viteContentHash`.
- **esbuild** (si no Vite o `AMABLE_SKIP_VITE=1`): bundle IIFE como antes.
- `GET /api/public/sitio/:slug/frame`: Vite si hay hash persistido; si no, esbuild.

## API app generada

- Contexto de proyecto: header **Referer** con `/proyecto/:id` o `/sitio/:slug` (este último resuelve `Publication` live).
- Auth app: cookie `amable_app_session` (mismo `AUTH_SECRET` que la plataforma; JWT distinto de `amable_session`).

## Seguridad

- JWT plataforma y JWT app: HttpOnly; `Secure` en producción.
- Secretos de integraciones en JSON en BD: **sin cifrado** en esta versión (documentado en product-spec).

## Limitaciones de escalado

- SSE runs: polling DB ~500 ms.
- Vite build en request/publish: CPU y tiempo de `npm install` por proyecto.
