# Paridad con AI product builders (Lovable y similares)

Este documento fija **qué nivel de “sí, igual que los competidores”** puedes afirmar **sin mentir**. La respuesta corta:

**Sí — para el flujo profesional de una app web generada con IA** (prompt → plan/spec → código → preview real → publicación → URL → datos → auth de app → export → iteración con créditos), **Amable Studio en `main` está equipado al mismo estándar de producto** que los referentes del segmento para ese recorrido.

**No — automáticamente** si quieres decir lo mismo sobre **todo el resto del ecosistema** de un builder cloud (base de datos gestionada infinita, sandbox de código arbitrario multi-tenant, marketplace de integraciones de nivel enterprise, dominios custom en un clic en toda región, etc.). Ahí el mercado aún va por delante o exige más superficie.

---

## 1. Checklist “mismo flujo de trabajo” (la respuesta puede ser **sí**)

| Capacidad (workflow típico Lovable-class) | Amable en `main` |
|---------------------------------------------|------------------|
| Cuenta, workspace, proyecto               | Sí               |
| Prompt → Plan (spec estructurada)         | Sí               |
| Plan → Build (código en repo de archivos) | Sí               |
| Plantillas / arquetipos premium           | Sí (3 verticales)|
| Editor de código + preview en iframe      | Sí               |
| **Misma build** preview y producción      | Sí (Vite o esbuild) |
| Publicar → URL pública                     | Sí `/sitio/[slug]` |
| Despublicar                                | Sí               |
| Backend generado por proyecto (CRUD API)   | Sí `/api/app/*`  |
| Auth para la **app generada** (roles)      | Sí (cookie app)  |
| Datos por proyecto (filas namespaced)      | Sí `GeneratedRow`|
| Export ZIP                                 | Sí               |
| Export / push GitHub                       | Sí (PAT)         |
| Import GitHub                              | Sí               |
| Catálogo integraciones + toggles           | Sí (Stripe/Supabase/GitHub adapters) |
| Créditos por iteración                    | Sí               |
| Estado único del “motor” (`/engine`)      | Sí               |
| Analítica básica del sitio publicado      | Sí               |
| OAuth Google/GitHub (plataforma)          | Sí (con env)     |
| E2E del camino principal                  | Sí Playwright    |

Si tu pregunta es **“¿puedo usar Amable día a día igual que un builder para sacar una app web en producción?”** → **sí**, con las variables y Postgres/Redis configurados, **tal y como está en `main`**.

---

## 2. Donde la respuesta sigue siendo **no** (sin drama)

| Área | Estado |
|------|--------|
| Código de usuario en microVM aislada (tipo E2B en cada proyecto) | No integrado como motor por defecto |
| DB Postgres dedicada **por tenant** auto-provisionada | Datos namespaced en tu Postgres, no un cluster por app |
| Integraciones: cifrado fuerte de secretos en reposo | Ver `docs/architecture.md` |
| Adjuntar archivos / dictado en el composer | UI deshabilitada (“próximamente”) |
| Dominio custom + SSL automatizado en toda región | No en el núcleo actual |

Para vender **igual** que un competidor en esas filas, haría falta el siguiente sprint; no invalida el **sí** del workflow core.

---

## 3. Cómo verificar tú mismo (1 comando mental)

1. `pnpm dev` + registro  
2. Proyecto → plantilla → Plan → Aprobar → Build  
3. Vista previa compila → Publicar → abrir `/sitio/...`  
4. `GET /api/v1/projects/<id>/engine` → huella y publicación live  

Si eso pasa, estás en **paridad de flujo** con lo que la mayoría de usuarios pro de estos productos **realmente usan** el 80 % del tiempo.

---

## 4. Claim comercial seguro (copy-paste)

> *“Amable Studio cubre el flujo completo de un AI web builder de primera línea: especificación, generación de código, preview y publicación con el mismo pipeline, URL pública, API y auth de la app generada, export a ZIP y GitHub, e iteración medida en créditos. Todo lo que va más allá del núcleo generador está documentado en la tabla de paridad.”*

---

Última revisión: rama `main` del repositorio (este repo).
