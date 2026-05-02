# Especificación de producto (Amable Studio)

## Objetivo

Gemelo funcional de la experiencia tipo *Lovable* con nombre **Amable Studio**, copy en **es-ES**, identidad visual parametrizada (tokens CSS) y sin reproducir marca ni textos protegidos de terceros.

## Alcance implementado en esta base

- Landing pública con CTAs en español.
- Registro e inicio de sesión (email/contraseña). Los botones OAuth (Google, GitHub, Apple) están en la UI con `disabled` explícito hasta tener adapters.
- Workspace automático en el registro; seed con roles demo.
- Dashboard con sidebar, command palette (Cmd/Ctrl+K), lista de proyectos y creación rápida.
- Proyecto: compositor Plan/Construir, SSE de estado, aprobación de plan → run de construcción.
- Vista previa HTML del archivo principal, editor Monaco con guardado, edición visual mínima (fondo del `main`).
- Comentarios con envío al agente (crea run de construir con contexto).
- Publicación a `/sitio/[slug]` y analítica por eventos.
- Créditos por workspace: consumo en transacción **Serializable** (lectura del ledger + insert de consumo en el mismo commit) para reducir carreras frente al patrón anterior.
- ZIP del proyecto, hallazgos de seguridad seed, checkout Stripe (endpoint; requiere claves).

## Limitaciones conocidas (honestas)

- **Vista previa y sitio publicado** no ejecutan un bundle React/Vite real: sirven una **vista segura** del código (HTML con escape) para demos. Sustituir por sandbox o build compilado es el salto de producto principal.
- El stream SSE del run hace **polling** a la base (~500 ms); es simple para demos, no óptimo a escala.

## Pendiente / ampliación

- OAuth real, 2FA TOTP/SMS, SSO OIDC/SAML adapters.
- Presencia WebSocket, carpetas UI, referrals reales.
- Sandboxing de preview estricto, runners E2E de preview/publicación.
- Conectores GitHub OAuth + sync bidireccional completo.
- Helm charts completos (aquí hay compose de producción de referencia + Traefik comentado).
