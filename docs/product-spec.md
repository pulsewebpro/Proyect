# Especificación de producto (Amable Studio)

## Objetivo

Gemelo funcional de la experiencia tipo *Lovable* con nombre **Amable Studio**, copy en **es-ES**, identidad visual parametrizada (tokens CSS) y sin reproducir marca ni textos protegidos de terceros.

## Alcance implementado en esta base

- Landing pública con CTAs en español.
- Registro e inicio de sesión (email/contraseña). Los botones OAuth (Google, GitHub, Apple) están en la UI con `disabled` explícito hasta tener adapters (OAuth de servidor **no implementado** aún).
- Workspace automático en el registro; seed con roles demo.
- Dashboard con sidebar, command palette (Cmd/Ctrl+K), lista de proyectos y creación rápida.
- Proyecto: compositor Plan/Construir, SSE de estado, aprobación de plan → run de construcción.
- **Vista previa y sitio publicado con runtime React real (mismo pipeline):** el servidor empaqueta `src/App.tsx` con **esbuild** (React 19 incluido en el bundle), sirve HTML con CSP estricta y el iframe usa `sandbox="allow-scripts allow-same-origin"`. La ruta autenticada es `GET /api/v1/projects/:id/preview-frame`; la ruta pública compartida es `GET /api/public/sitio/:slug/frame`. La página `/sitio/[slug]` incrusta ese frame; el beacon de analítica sigue en la shell de la página.
- Editor Monaco con guardado, edición visual mínima (fondo del `main`).
- Comentarios con envío al agente; **resolver / reabrir** hilos vía `PATCH /api/v1/projects/:id/comments/:threadId`.
- Publicación `POST .../publish`, **despublicar** `DELETE .../publish` (marca `unpublished`, borra dominios vinculados); slug y `liveUrl` coherentes.
- Créditos: transacción **Serializable** + **reintentos** ante conflicto `P2034` (Prisma).
- ZIP del proyecto, hallazgos de seguridad seed, checkout Stripe (endpoint; requiere claves).

## Limitaciones conocidas (honestas)

- El bundle de preview/publicación **solo incluye `src/App.tsx` como entrada de usuario**; no empaqueta todo el árbol del proyecto ni dependencias arbitrarias del usuario. Es un runtime **real** para el patrón “una app en un archivo”, no un sustituto completo de Vite multi-archivo.
- El stream SSE del run hace **polling** a la base (~500 ms); es simple para demos, no óptimo a escala.
- OAuth social de servidor, 2FA, SSO, GitHub sync y conectores productivos siguen en la lista de pendientes.

## Pendiente / ampliación

- OAuth real (Google/GitHub/Apple), 2FA TOTP/SMS, SSO OIDC/SAML.
- Presencia WebSocket, carpetas UI, referrals reales, compartir/invitaciones completas.
- Empaquetado multi-archivo (resolver imports entre `ProjectFile`), sandbox más duro si hace falta `allow-same-origin`.
- Conectores GitHub OAuth + sync bidireccional completo.
- Helm charts completos (aquí hay compose de producción de referencia + Traefik comentado).
