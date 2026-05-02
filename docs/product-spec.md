# Especificación de producto (Amable Studio)

## Objetivo

Gemelo funcional de la experiencia tipo *Lovable* con nombre **Amable Studio**, copy en **es-ES**, identidad visual parametrizada (tokens CSS) y sin reproducir marca ni textos protegidos de terceros.

## Alcance implementado en esta base

- Landing pública con CTAs en español.
- **Autenticación:** email/contraseña (JWT cookie). **OAuth Google y GitHub** vía `GET /api/auth/oauth/{google|github}` → callback → enlace de `Identity` y sesión; requiere `GOOGLE_*` / `GITHUB_*` en env (sin claves, redirección a login con `oauth_not_configured`). **Apple:** no hay botón de login; no soportado.
- Workspace automático en el registro y tras OAuth si el usuario no tenía uno; seed con roles demo.
- Dashboard con sidebar, command palette (Cmd/Ctrl+K), lista de proyectos y creación rápida (sin CTAs de invitaciones/plan/bandeja hasta que existan).
- Proyecto: compositor Plan/Construir, SSE de estado, aprobación de plan → run de construcción.
- **Vista previa y sitio publicado — mismo runtime ejecutable:** esbuild empaqueta **todos los archivos `.ts/.tsx/.js/.jsx` del proyecto** desde disco temporal (imports relativos entre archivos del repo resueltos). React/ReactDOM se resuelven desde el host. Rutas: `GET /api/v1/projects/:id/preview-frame` (auth) y `GET /api/public/sitio/:slug/frame` (público). `/sitio/[slug]` incrusta el frame; analítica en la shell.
- **Publicar:** `POST .../publish` ejecuta opcionalmente **revisión heurística de `package.json`** si `runSecurityCheck: true` (`revisión_paquete_fallida` + detalles si bloquea); luego **esbuild**; **422** `compilación_fallida` si el bundle falla; solo entonces `live`. `DELETE .../publish` despublica; el frame público devuelve **503** si el proyecto ya no compila.
- Editor Monaco, edición visual mínima (fondo del `main`).
- Comentarios + enviar al agente; **resolver/reabrir** con `PATCH .../comments/:threadId`.
- **GitHub import:** `POST /api/v1/projects/:id/github/import` — API de contenidos GitHub; **repos públicos sin token** hasta que GitHub exija auth o rate limit (entonces token en body o `GITHUB_IMPORT_TOKEN`). Upsert en `ProjectFile`. Sin push ni webhooks.
- Créditos: transacción Serializable + reintentos `P2034`.
- ZIP de proyecto, Stripe checkout (requiere claves). Endpoint `GET .../security` conservado para integraciones futuras; la UI no lista hallazgos estáticos como escaneo.

## Limitaciones conocidas (honestas)

- El bundle **no** es Vite completo: no `node_modules` del proyecto usuario, no empaquetado de dependencias arbitrarias salvo React del host.
- SSE de runs: polling ~500 ms.
- Apple Sign In no está en el producto (sin UI).
- Export/push a GitHub (escritura) no implementado; solo import.

## Pendiente / ampliación

- 2FA, SSO, invitaciones por email, permisos de proyecto avanzados.
- Push/sync bidireccional a GitHub.
- Sandbox preview sin `allow-same-origin` si se exige aislamiento máximo.
- Helm producción completo.
