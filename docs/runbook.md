# Runbook operativo

## Servicios

- **web**: proceso Node `next start` o imagen Docker `amable-web`.
- **worker**: proceso Node ejecutando `apps/worker` contra Redis.
- **postgres**: base principal.
- **redis**: cola BullMQ.
- **minio** (opcional): almacenamiento binario futuro.
- **mailhog** (opcional): correo en desarrollo.

## Variables críticas

- `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`, `PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (facturación)

## Migraciones

```bash
pnpm exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

## Resolución de incidencias

- **Runs atascados en cola**: comprobar worker y Redis; reintentar job o ejecutar `processRun` manualmente en entorno de mantenimiento.
- **Créditos inconsistentes**: auditar tabla `CreditLedger` por workspace.

## Backups

Snapshot lógico de Postgres + export ZIP por proyecto desde la API.
