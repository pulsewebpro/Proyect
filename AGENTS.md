# Amable Studio — agentes

## Contrato de producto honesto

- Si la UI o los docs muestran una función, debe existir y comportarse como se describe.
- Si algo no está implementado (Apple OAuth, invitaciones, sync Git bidireccional, escáner enterprise), no debe aparecer como disponible: quítalo de la UI o etiquétalo como **no soportado**.
- Preview y sitio publicado comparten el mismo pipeline de compilación (`esbuild`); publicar falla si la compilación falla.
- La revisión de seguridad antes de publicar es solo la **puerta heurística documentada** (dependencias en `package.json`), no un SAST comercial.
- Créditos: transacciones Prisma `Serializable` con reintentos en conflictos.

## QA antes de dar por cerrado

`pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, E2E Playwright del flujo principal.

## Checklist viva

Ver `docs/closeout.md` y márcalo al completar hitos.
