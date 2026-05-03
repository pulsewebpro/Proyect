# Arrancar hoy (MVP)

## Comandos

Desde la raíz del monorepo (con Node 20+ y pnpm 9):

```bash
cp .env.example .env
# Ajusta DATABASE_URL si tu Postgres no es el de ejemplo
pnpm install
pnpm exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
pnpm db:seed
pnpm dev
```

Abre `http://localhost:3000`. Para solo la app web:

```bash
pnpm --filter @amable/web dev
```

## Variables mínimas

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Postgres (obligatorio) |
| `AUTH_SECRET` | Mínimo 16 caracteres (sesiones JWT) |
| `REDIS_URL` | Cola de runs BullMQ (obligatorio para jobs en segundo plano) |
| `PUBLIC_APP_URL` | URL pública base (enlaces en emails, OAuth callbacks) |

Producción con IA real: al menos una de `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`. Sin ellas, en `NODE_ENV=production` el run falla con mensaje claro; en local sin keys se usa el mock determinista (Vite + spec de ejemplo).

Opcional: `GITHUB_IMPORT_TOKEN`, OAuth Google/GitHub, `RESEND_API_KEY` (recuperación de contraseña), `GITHUB_*` para import/export.

## Qué funciona

- Registro / login, workspace, crear proyecto, editor y vista previa.
- Modo **Plan** (spec estructurada) y **Construir** (archivos); aprobar plan encola el build.
- Preview y publicación comparten pipeline: **Vite** si el proyecto tiene `vite` en `package.json`, si no **esbuild**.
- Sitio público en `/sitio/[slug]`, ZIP, export GitHub con PAT, integraciones en proyecto, API generada `/api/app/...` con datos por `projectId`.

## Qué está acotado u oculto

- Adjuntar archivos y dictado: botones deshabilitados (“próximamente”).
- Secretos de integraciones en BD sin cifrado adicional (ver `docs/architecture.md`).
- Dominios custom y SSO: no el núcleo de este MVP.

## Probar el flujo automático

Con Postgres y Redis levantados:

```bash
pnpm --filter @amable/web build
pnpm --filter @amable/web start &
pnpm exec wait-on http://127.0.0.1:3000 -t 120000
pnpm test:e2e
```

El primer build Vite en CI puede tardar varios minutos (npm install + vite build).
