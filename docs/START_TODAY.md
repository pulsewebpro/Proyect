# Arrancar hoy (producto)

Modo **plataforma**: el primer entregable es una app web publicable (preview = publicación); los **créditos** miden cada run de mejora hasta el nivel visual y funcional que quieras vender.

**Estado del motor (contrato único):** `GET /api/v1/projects/<id>/engine` devuelve huella, archivos, runs, créditos consumidos en el proyecto y publicación live. La UI del proyecto lo usa para la barra “Motor del producto”. `GET .../life` queda como alias compatible.

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

- **Plantillas premium** (selector en el proyecto): `bookings` (reservas + panel + tabla), `saas_dashboard` (CRM con leads), `landing_auth` (landing + lista de espera pública + auth). El mock local y el LLM (con keys) siguen las mismas reglas visuales; la plantilla se guarda en el run y en `spec.metadata.template`.

## Qué funciona

- Registro / login, workspace, crear proyecto, editor y vista previa.
- Modo **Plan** (spec estructurada) y **Construir** (archivos); aprobar plan encola el build.
- Preview y publicación comparten pipeline: **Vite** si el proyecto tiene `vite` en `package.json`, si no **esbuild**.
- Sitio público en `/sitio/[slug]`, ZIP, export GitHub con PAT, integraciones en proyecto, API generada `/api/app/...` con datos por `projectId`.

## Qué está acotado u oculto

- Adjuntar archivos y dictado: botones deshabilitados (“próximamente”).
- Secretos de integraciones en BD sin cifrado adicional (ver `docs/architecture.md`).
- Dominios custom y SSO: no el núcleo de este MVP.

## Paridad con AI builders (Lovable-class)

Para decir **sí, mismo flujo profesional** (prompt → spec → código → preview = publicación → URL → datos → export → créditos) con límites explícitos fuera del núcleo:

- **[BUILDER_PARITY.md](./BUILDER_PARITY.md)**
- En la app: **`/paridad`**

## Probar el flujo automático

Con Postgres y Redis levantados:

```bash
pnpm --filter @amable/web build
pnpm --filter @amable/web start &
pnpm exec wait-on http://127.0.0.1:3000 -t 120000
pnpm test:e2e
```

El primer build Vite en CI puede tardar varios minutos (npm install + vite build).
