# Especificación de producto (Amable Studio)

## Objetivo

Gemelo funcional de la experiencia tipo *Lovable* con nombre **Amable Studio**, copy en **es-ES**, identidad visual parametrizada (tokens CSS) y sin reproducir marca ni textos protegidos de terceros.

## Alcance implementado en esta base

- Landing pública con CTAs en español.
- Registro e inicio de sesión (email/contraseña). OAuth Google/GitHub/Apple como UI deshabilitada (pendiente de adapters).
- Workspace automático en el registro; seed con roles demo.
- Dashboard con sidebar, command palette (Cmd/Ctrl+K), lista de proyectos y creación rápida.
- Proyecto: compositor Plan/Construir, SSE de estado, aprobación de plan → run de construcción.
- Vista previa HTML del archivo principal, editor Monaco con guardado, edición visual mínima (fondo del `main`).
- Comentarios con envío al agente (crea run de construir con contexto).
- Publicación a `/sitio/[slug]` y analítica por eventos.
- Créditos por workspace y consumo en runs (mock de coste).
- ZIP del proyecto, hallazgos de seguridad seed, checkout Stripe (endpoint; requiere claves).

## Pendiente / ampliación

- OAuth real, 2FA TOTP/SMS, SSO OIDC/SAML adapters.
- Presencia WebSocket, carpetas UI, referrals reales.
- Sandboxing de preview más estricto, runners E2E de preview.
- Conectores GitHub OAuth + sync bidireccional completo.
- Helm charts completos (aquí hay compose de producción de referencia + Traefik comentado).
