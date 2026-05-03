# Lo que necesito de ti (para producción «de verdad»)

Rellena en **Vercel** (o tu proveedor) lo siguiente. Sin esto, parte del producto queda limitada o apagada por seguridad.

## Imprescindible

1. **`DATABASE_URL`** — Postgres gestionado con copias automáticas activadas en el panel del proveedor (Neon, Supabase, RDS…).
2. **`AUTH_SECRET`** — Cadena larga y aleatoria (32+ caracteres). No la compartas ni la reutilices en otros sitios.
3. **`PUBLIC_APP_URL`** — La URL pública exacta con `https://` (ej. `https://studio.tudominio.com`). Debe coincidir con el dominio donde despliegas.
4. **`REDIS_URL`** — Para la cola de trabajos (runs en segundo plano). En Vercel suele ser Upstash u otro Redis gestionado.
5. **Al menos una clave de IA:** `OPENAI_API_KEY` **o** `ANTHROPIC_API_KEY` (y opcionalmente `OPENAI_MODEL` / `ANTHROPIC_MODEL`). Sin esto, en producción los runs **fallan** a propósito.

## Muy recomendable

6. **`OPERATIONS_SECRET`** — Contraseña larga solo para ti; sirve para entrar en `/admin/ops` y ver métricas básicas.
7. **`CRON_SECRET`** — Misma idea; Vercel lo usará para llamar al cron de limpieza de tokens (`vercel.json`). Configura en Vercel el cron con cabecera `Authorization: Bearer <CRON_SECRET>` si tu plan no la inyecta solo.
8. **`RESEND_API_KEY`** y **`RESEND_FROM`** — Para que la recuperación de contraseña **envíe correo de verdad** (ej. `Equipo <noreply@tudominio.com>` verificado en Resend).
9. **`SUPPORT_EMAIL`** — Correo visible en legales y en el email de recuperación (sustituye el placeholder `soporte@tudominio.com`).

## Si usas estas funciones

10. **OAuth:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
11. **GitHub import/export:** `GITHUB_IMPORT_TOKEN` (PAT con `repo` si exportas o importas privados).
12. **Stripe** (si cobras): las variables que ya use el proyecto de facturación + **webhook** en el dashboard de Stripe apuntando a tu despliegue.

## Opcional / control

13. **`REGISTRATION_OPEN=0`** — Cierra el registro público (solo invitaciones manuales o OAuth si lo dejas).
14. **`HEALTH_STRICT=1`** — Hace que `/api/health` devuelva error si faltan claves LLM o Redis va mal (útil para alertas de uptime).
15. **`AMABLE_SKIP_VITE=1`** — Si no quieres que el servidor ejecute `npm install` + Vite en publicación (más barato/predictible; solo esbuild).

## Fuera del código (tú o tu equipo)

- **Dominio y DNS** apuntando a Vercel.
- **Textos legales definitivos** en `/privacidad`, `/terminos` y `/cookies` (ahora son plantillas revisables con tu abogado).
- **Copias de seguridad del Postgres** además del script `scripts/db-backup.sh`: activa retención en el proveedor de base de datos.
- **Alertas** (Vercel, Better Stack, etc.) sobre `/api/health` cuando `HEALTH_STRICT=1`.

Cuando tengas todo esto, el producto está en condiciones de **lanzamiento controlado**; el resto es marketing, soporte humano y iteración sobre lo que midan los usuarios.
