# Informe de cierre — Amable Studio

Generado tras la rama `cursor/closeout-honest-8be7`.

**En este entorno de agente:** `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` se ejecutaron con éxito. No había PostgreSQL en `localhost:5432`, por lo que no se pudieron repetir aquí `prisma migrate deploy`, `db:seed` ni Playwright contra un servidor real; la CI de GitHub (`.github/workflows/ci.yml`) es la referencia para migración, seed, `next start` y `pnpm test:e2e`.

## Qué funciona (núcleo)

- Registro/login email + OAuth Google/GitHub cuando existen variables de entorno.
- Dashboard → crear proyecto → editor Monaco.
- Vista previa y sitio publicado: mismo pipeline `bundleProjectFiles` (esbuild).
- Publicar: revisión opcional de `package.json`, compilación, estado `live`; despublicar deja de servir el sitio.
- Analítica: `POST /api/public/analytics` persiste eventos; panel recarga al abrir pestaña Analítica.
- Import GitHub: público sin token hasta límite de API; token opcional.

## Qué verifiqué

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` en el workspace del agente.
- Playwright del flujo extendido: ejecutar en CI (servicios Postgres + Redis + app en marcha).

## Qué cambié (resumen)

- `AGENTS.md`, `docs/closeout.md`, `docs/closeout-report.md` (este archivo).
- Superficie honesta: sin Apple en UI; sin botones muertos en dashboard; pestaña “Antes de publicar”; seguridad sin lista seed engañosa.
- Puerta real mínima: `publish-security-gate.ts` + integración en `publish` route.
- Analítica: país `null` en ingesta.
- Frame público: 503 si compilación falla (no HTML “éxito” con error).
- GitHub import: token opcional para repos públicos.
- E2E extendido.

## Bloqueado solo por secretos externos

- OAuth Google/GitHub sin `CLIENT_ID`/`SECRET` en env (flujo redirige con error explícito).
- Stripe checkout sin claves reales.
- Sign in with Apple (no soportado en producto).

## Riesgos residuales

- Preview iframe `sandbox` con `allow-same-origin` (documentado en product-spec).
- esbuild en request (latencia CPU bajo carga).
- SSE de runs por polling a DB.
