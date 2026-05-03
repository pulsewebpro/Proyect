/** Snippets appended to LLM system prompts so outputs match premium templates. */

export function premiumPlanRules(templateId: string): string {
  return `
PLANTILLA DE SALIDA (obligatoria): "${templateId}".
- bookings: app de reservas con shell (nav), dashboard KPIs, tabla de reservas con filtros/empty state/formulario, ruta admin simulada. Entidad principal Booking.
- saas_dashboard: CRM/SaaS con sidebar, overview con tarjetas KPI y embudo, tabla Leads con búsqueda y empty state, settings. Entidad Lead. Integración stripe en spec.integrations.
- landing_auth: marketing landing (hero + prueba social + 3 features), lista de espera (entidad WaitlistEntry), página auth. Rutas claras.
Incluye siempre auth.enabled true y roles user/admin. JSON válido solo, sin markdown.`;
}

export function premiumBuildRules(templateId: string): string {
  return `
PLANTILLA "${templateId}" — calidad producto (no demo técnica):
- Vite + React 19 + TypeScript + react-router-dom (HashRouter para rutas en iframe).
- Archivos: package.json (react-router-dom), vite.config.ts, index.html, src/main.tsx, src/index.css, src/App.tsx.
- Tipografía: importa Google Font "DM Sans" en index.html; en CSS define variables --bg, --panel, --accent (#6366f1), --accent2 (#22d3ee), cards con borde sutil, sombra, radius 14px, responsive con @media.
- UI: navegación, tablas con thead, formularios con labels, botones primario/secundario, badges, estados vacíos con icono/CTA, filtros o búsqueda donde aplique.
- Datos: fetch a /api/app/<Entity> (capitalización PascalCase igual que entidades del spec). Auth app: /api/app/auth/register|login|me con credentials include.
- landing_auth: POST público a /api/app/WaitlistEntry con {name,email} sin login.
- Incluye data-testid="e2e-generated-root" en el contenedor principal de cada vista principal y data-testid="e2e-prompt-snippet" mostrando un slice del pedido del usuario.
- Sin secretos en código. Solo JSON con files[].`;
}
