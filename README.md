# Amable Studio

Monorepo **Amable Studio**: plataforma SaaS web (es-ES) inspirada en el flujo *idea → prompt → vista previa → publicación*, con identidad visual parametrizable y sin marca de terceros.

## Requisitos

- Node.js 20+
- pnpm 9+
- Docker y Docker Compose (para entorno local completo)

## Arranque rápido

```bash
cp .env.example .env
pnpm install
docker compose -f infra/compose/docker-compose.yml up -d
pnpm exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
pnpm db:seed
pnpm dev
```

Abre `http://localhost:3000`. Usuarios demo tras el seed: `owner@demo.amable` / `Demo12345!` (y admin/editor/viewer con el mismo secreto).

## Scripts raíz

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Turborepo: web + worker en modo desarrollo |
| `pnpm build` | Compila paquetes y la app web |
| `pnpm lint` | ESLint en workspaces |
| `pnpm test` | Vitest en workspaces |
| `pnpm test:e2e` | Playwright (requiere web + DB) |
| `pnpm db:seed` | Ejecuta `prisma db seed` |
| `pnpm openapi` | Genera `apps/web/public/openapi.json` y copia a `docs/screens/openapi.json` |
| `bash scripts/db-backup.sh ./backups` | Volcado SQL comprimido (requiere `pg_dump` y `DATABASE_URL`) |

## Estructura

- `apps/web` — Next.js 15 (App Router), API `/api/v1`, SSE de runs, UI en español
- `apps/worker` — BullMQ consumer para cola `runs`
- `packages/*` — UI, DB (Prisma), auth, jobs, créditos, facturación, conectores, etc.
- `infra/compose` — Postgres, Redis, MinIO, MailHog
- `infra/docker` — Dockerfiles de producción
- `docs/runbook-production.md` — despliegue, salud, cron, variables
- `docs/WHAT_YOU_NEED_FROM_ME.md` — checklist de lo que debe configurar el dueño del producto

## Licencia

Privado / uso interno del repositorio.
