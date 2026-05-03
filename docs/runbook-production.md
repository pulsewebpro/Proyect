# Runbook de producción (Amable Studio)

## Variables en Vercel (mínimo)

| Variable | Para qué |
|----------|----------|
| `DATABASE_URL` | Postgres gestionado (Neon, Supabase, RDS, etc.) |
| `AUTH_SECRET` | Mínimo 16 caracteres; firma sesiones plataforma y panel ops |
| `PUBLIC_APP_URL` | URL pública exacta (https://tu-dominio.com) |
| `REDIS_URL` | Cola BullMQ para runs en segundo plano |
| `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` | Runs con IA en producción |
| `OPERATIONS_SECRET` | Mínimo 16 caracteres; acceso al panel `/admin/ops` |
| `CRON_SECRET` | Mínimo 16 caracteres; `Authorization: Bearer …` en cron de Vercel |
| `RESEND_API_KEY` + `RESEND_FROM` | Correo de recuperación de contraseña |
| `SUPPORT_EMAIL` | Aparece en correos y en páginas legales |
| `GITHUB_*` / `GOOGLE_*` | OAuth si lo usas |
| `GITHUB_IMPORT_TOKEN` | Import/export GitHub opcional |
| `REGISTRATION_OPEN` | `1` (defecto) o `0` para cerrar registro público |
| `HEALTH_STRICT` | `1` para que `/api/health` falle si faltan claves LLM o Redis mal |
| `AMABLE_SKIP_VITE` | `1` en CI o si no quieres `npm install` en el servidor |

## Salud y monitorización

- **Público:** `GET /api/health` — comprueba base de datos; Redis y LLM opcionales según `HEALTH_STRICT`.
- **Cron:** `GET /api/cron/cleanup-password-tokens` — en Vercel, al definir `CRON_SECRET` en el proyecto, el Cron Jobs envía `Authorization: Bearer <CRON_SECRET>` automáticamente (ver `vercel.json`, 04:00 UTC).

## Copias de seguridad

- Script: `bash scripts/db-backup.sh ./backups` (necesita `pg_dump` y `DATABASE_URL`).
- En producción real: activa **copias automáticas** en el proveedor de Postgres (Neon/RDS) además de este script.

## Panel interno

- Abre `/admin/ops`, introduce `OPERATIONS_SECRET` y revisa métricas (`/api/admin/metrics`).

## Límites in-memory

- Registro, login, runs y reset de contraseña usan límites por IP en memoria. Con **varias instancias** de serverless, el límite es aproximado; para límites estrictos usa Redis o el firewall de Vercel.
