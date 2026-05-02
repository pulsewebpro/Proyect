# Checklist de cierre — Amable Studio

Marca `[x]` cuando esté verificado en código y en CI local o remota.

## Núcleo end-to-end

- [x] Registro / login (email + OAuth Google/GitHub con env) → sesión real
- [x] Workspace → crear proyecto → editor
- [x] Vista previa = runtime compilado (mismo pipeline que publicado)
- [x] Publicar compila antes de `live`; error 422 claro si falla
- [x] Despublicar → `/sitio/:slug` y frame público 404
- [x] Sitio publicado envía analítica real (`POST /api/public/analytics`)
- [x] Panel analítica refleja eventos reales (sin país inventado)

## Superficie honesta

- [x] Sin botón Apple como login real
- [x] Sin botones muertos en dashboard (Invitar, plan, bandeja, novedades)
- [x] Compartir: solo import GitHub + export manual (ZIP); sin prometer sync bidireccional
- [x] Seguridad: sin datos seed fingiendo escaneo; puerta heurística al publicar documentada

## GitHub

- [x] Import público sin token (rate limit documentado); token opcional para privado/cuota
- [x] Docs/UI alineados (import + ZIP, no push automático)

## Documentación

- [x] `docs/product-spec.md` y `docs/architecture.md` coinciden con el repo
- [x] `docs/closeout-report.md` actualizado con evidencia de comandos

## QA obligatorio

- [x] `pnpm lint` ✓
- [x] `pnpm typecheck` ✓
- [x] `pnpm test` ✓
- [x] `pnpm build` ✓
- [x] E2E: registro → dashboard → proyecto → preview → publicar → URL pública
