# Especificación de producto (Amable Studio)

## Objetivo

Plataforma tipo *Lovable* (Amable Studio) en **es-ES**: workspace, proyectos, runs con LLM real, spec estructurada, backend y datos lógicos por proyecto, auth de la app generada, preview/publicación (esbuild o Vite si el proyecto lo define), GitHub import/export, integraciones mínimas y cierre honesto en UI/docs.

## Alcance implementado

### Plataforma (landing, auth, workspace)

- Landing pública con CTAs en español.
- **Autenticación:** email/contraseña (JWT cookie `amable_session`). **OAuth Google y GitHub** (`GOOGLE_*`, `GITHUB_*`); sin claves → `oauth_not_configured`. **Apple:** no hay botón de login; no soportado.
- Workspace automático al registrarse o tras OAuth; seed con roles demo.
- Dashboard: command palette (Cmd/Ctrl+K), proyectos; sin CTAs muertos de invitaciones/plan/bandeja.
- Comentarios + resolver/reabrir; créditos Serializable + reintentos `P2034`; ZIP; Stripe checkout (requiere claves).

### Runs y motor LLM

- `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`: runs **reales**. Modelos opcionales: `OPENAI_MODEL`, `ANTHROPIC_MODEL`.
- **Producción:** sin ninguna key, el run **falla** (no mock).
- **Local:** sin keys → mock determinista.

### Modo Plan → Product spec

- JSON validado (`pages`, `entities`, `auth`, `api`, `integrations`, `permissions`) → `ProjectProductSpec`; pestaña **Product spec**.
- Tras el plan: filas demo en `GeneratedRow` y `ProjectIntegration` (desactivadas hasta activarlas en UI).

### Modo Construir

- LLM/mock emite archivos (`file`) → upsert `ProjectFile`; eventos legacy `diff` (append).
- Build aprobado usa el `planDocument` como contexto.

### Backend generado

- `GET/POST /api/app/:entity`, `GET/PATCH/DELETE /api/app/:entity/:id` — proyecto inferido por **Referer** (`/proyecto/:id` o `/sitio/:slug` live).
- **Auth app:** `POST /api/app/auth/register|login|logout`, `GET /api/app/auth/me`; cookie `amable_app_session`.

### Preview y publicación

- **Vite** si `package.json` declara `vite`: `npm install` + `vite build`, hash en `Publication.viteContentHash`, assets bajo rutas `preview-vite` / `sitio/.../vite`.
- **`AMABLE_SKIP_VITE=1`:** fuerza esbuild (útil en CI).
- Sin Vite: **esbuild** multiarchivo + React del host (mismo criterio que antes).
- **Publicar:** si `runSecurityCheck`, **revisión heurística** de `package.json` (`revisión_paquete_fallida`); luego Vite o esbuild; errores **422** o **503** en frame público si no compila.
- Analítica pública: `POST /api/public/analytics`; país `null` en ingesta.

### GitHub

- **Import:** API contenidos; público sin token hasta límite; token opcional.
- **Export:** `POST .../github/export` — commit real en rama existente (PAT `repo`). Sin webhooks ni merge automático.

### Integraciones (marketplace mínimo)

- `GET/PATCH /api/v1/projects/:id/integrations` — `stripe` | `supabase` | `github`; `config`/`secrets` como JSON (**sin cifrado en reposo**).

### Otros

- `GET .../security` conservado para el futuro; la UI no presenta hallazgos seed como “escaneo real”.
- Documentación: `AGENTS.md`, `docs/closeout.md`, `docs/closeout-report.md`.

## Limitaciones honestas

- `/api/app/*` depende del **Referer** para el contexto del proyecto.
- Vite en servidor: build lento y dependiente de `npm`.
- Integraciones guardadas no ejecutan llamadas externas hasta que el código generado las use.
- SSE de runs: polling ~500 ms.
- Apple Sign In no está en el producto (sin UI).
- Preview iframe: `sandbox` con `allow-same-origin` (ver arquitectura).

## Variables de entorno

Ver `.env.example`: `DATABASE_URL`, `AUTH_SECRET`, `REDIS_URL`, OAuth, `GITHUB_IMPORT_TOKEN`, `OPENAI_*`, `ANTHROPIC_*`, `AMABLE_SKIP_VITE`.
