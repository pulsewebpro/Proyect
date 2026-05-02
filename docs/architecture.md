# Arquitectura

## Vista general

La aplicación separa el **plano de control** (usuarios, workspaces, proyectos, runs, facturación) del **runtime de proyectos generados** (archivos en Postgres, **bundle de preview/publicación con esbuild**, publicación en `/sitio/[slug]`).

- **apps/web**: Next.js 15 con Route Handlers REST bajo `/api/v1`, autenticación por cookie JWT (`jose`), middleware de protección de rutas, SSE para estado de runs, y UI en español.
- **apps/worker**: Worker BullMQ que procesa jobs `process` en la cola `runs` llamando a `@amable/jobs`.
- **packages/db**: Prisma + PostgreSQL. Modelos para usuarios, workspaces, proyectos, archivos, runs, comentarios, publicaciones, analítica, etc.
- **packages/jobs**: Orquestación de un run (modo Plan vs Construir) con stream simulado `@amable/ai` y aplicación de diffs a `ProjectFile` en modo Construir.
- **packages/credits**: Ledger de créditos; el consumo usa transacción **Serializable** con **reintentos** ante `P2034`.
- **packages/ui**: Tokens CSS, componentes Radix + Tailwind exportados desde `@amable/ui`.

## Limitaciones de escalado (conocidas)

- El endpoint SSE de runs **consulta la base de datos en bucle** (~500 ms) hasta terminar el run; es adecuado para demos, no para muchos clientes simultáneos sin sustituir por eventos push o canal dedicado.

## Flujo de un run

1. El cliente envía `POST /api/v1/projects/:id/runs` con `mode` y `prompt`.
2. Se encola un job en Redis (`runs`) o, si Redis no está disponible, se dispara `processRun` en proceso (fallback dev).
3. El worker o el fallback ejecuta pasos simulados, escribe mensajes y, en modo Construir, actualiza archivos.
4. El cliente se suscribe a `GET .../runs/:runId/stream` (SSE) para ver progreso.

## Publicación y analítica

- `POST /api/v1/projects/:id/publish` **compila** tras una **revisión heurística opcional** de `package.json` (`runSecurityCheck`); bloqueos devuelven **422** `revisión_paquete_fallida`. Luego esbuild; **422** `compilación_fallida` si falla. Si OK, upsert `Publication` + `DomainBinding` opcional.
- `DELETE /api/v1/projects/:id/publish` despublica (limpia dominios, marca `unpublished`).
- Vista previa autenticada: `GET /api/v1/projects/:id/preview-frame` (esbuild + React).
- Sitio publicado: shell en `/sitio/[slug]` + `GET /api/public/sitio/:slug/frame` (mismo bundler).
- Las visitas se registran con `POST /api/public/analytics` desde la shell publicada, persistiendo `AnalyticsEvent` (país `null`; dispositivo heurístico desde user-agent).

## Seguridad

- JWT en cookie HttpOnly. El middleware solo importa `@amable/auth/session` para no arrastrar `bcryptjs` al Edge bundle.
- En producción: rotar `AUTH_SECRET`, TLS en el proxy, y políticas de cookies `Secure`.
- Antes de publicar (opcional): comprobación **heurística** de dependencias en `package.json` (no CVE/SAST). La compilación es la segunda barrera.
