# Especificación de producto (Amable Studio)

## Objetivo

Plataforma tipo *Lovable* (Amable Studio) en **es-ES**: workspace, proyectos, runs con LLM real, spec estructurada, backend y datos lógicos por proyecto, auth de la app generada, preview/publicación (esbuild o Vite si el proyecto lo define), GitHub import/export e integraciones mínimas.

## Alcance implementado

### Autenticación plataforma

- Email/contraseña + OAuth Google/GitHub (`GOOGLE_*`, `GITHUB_*` en env).
- Apple: ruta técnica existe; no se ofrece como producto en UI de login.

### Runs y motor LLM

- `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`: runs **reales** (OpenAI Chat Completions o Anthropic Messages). Modelos opcionales: `OPENAI_MODEL`, `ANTHROPIC_MODEL`.
- **Producción** (`NODE_ENV=production`): sin ninguna key, el run falla con error explícito (no mock).
- **Local** (`NODE_ENV` distinto de `production`): sin keys se usa **mock** determinista (solo desarrollo).

### Modo Plan → Product spec

- El LLM (o mock local) devuelve JSON validado (`pages`, `entities`, `auth`, `api`, `integrations`, `permissions`).
- Se persiste en `ProjectProductSpec` y se muestra en la pestaña **Product spec**.
- Tras el plan se crean filas demo en `GeneratedRow` por entidad y filas en `ProjectIntegration` para integraciones mencionadas (desactivadas hasta que el usuario las active).

### Modo Construir

- El LLM (o mock) puede emitir archivos completos (`file` events); se hace upsert en `ProjectFile`.
- El build aprobado reutiliza el `planDocument` como contexto en el prompt.

### Backend generado (mismo host)

- `GET/POST /api/app/:entity` — lista y crea filas en `GeneratedRow` para el proyecto inferido por **Referer** (`/proyecto/:id` o `/sitio/:slug` publicado).
- `GET/PATCH/DELETE /api/app/:entity/:id` — lectura pública de ítem; **PATCH/DELETE solo rol `admin`** de la app generada.
- **Auth app generada:** `POST /api/app/auth/register|login|logout`, `GET /api/app/auth/me`. Cookie HttpOnly `amable_app_session` (JWT con `AUTH_SECRET`). POST crear requiere sesión de app (login/register establece cookie).

### Preview y publicación

- Si `package.json` incluye **vite** en dependencias: se ejecuta `npm install` + `vite build` en temp dir, artefacto en disco bajo hash de contenido; `preview-frame` y `frame` público sirven `index.html` con assets bajo `/api/.../preview-vite/:hash/*` o `/api/public/sitio/:slug/vite/:hash/*`. Hash guardado en `Publication.viteContentHash`.
- Variable `AMABLE_SKIP_VITE=1` (p. ej. CI sin red/npm pesado): se omite Vite y se usa **esbuild** como antes.
- Sin Vite en el proyecto: mismo pipeline **esbuild** multiarchivo + React del host.

### GitHub

- **Import:** `POST /api/v1/projects/:id/github/import` (público sin token hasta límite API; token opcional).
- **Export:** `POST /api/v1/projects/:id/github/export` — commit real sobre rama existente (Git data API). Requiere PAT `repo`. No merge automático ni webhooks.

### Integraciones (marketplace mínimo)

- `GET/PATCH /api/v1/projects/:id/integrations` — catálogo `stripe` | `supabase` | `github`; activar y guardar `config`/`secrets` como JSON (sin cifrado en reposo: solo entornos controlados).

### Otros

- ZIP de proyecto, créditos Serializable + reintentos, analítica pública, comentarios, Stripe checkout (requiere claves).

## Limitaciones honestas

- `/api/app/*` resuelve proyecto por **Referer**; llamadas server-to-server sin Referer no tienen contexto.
- Vite build en publicación puede ser **lento** y depende de `npm` en el runtime del servidor.
- Integraciones: adapters almacenados; **no** se ejecutan llamadas reales a Stripe/Supabase/GitHub salvo código que el LLM genere usando esos secretos.
- SSE de runs: polling ~500 ms.
- Preview iframe: `sandbox` con `allow-same-origin` (riesgo documentado en arquitectura).

## Variables de entorno (resumen)

Ver `.env.example`: `DATABASE_URL`, `AUTH_SECRET`, `REDIS_URL`, OAuth, `GITHUB_IMPORT_TOKEN`, `OPENAI_*`, `ANTHROPIC_*`, `AMABLE_SKIP_VITE`.
