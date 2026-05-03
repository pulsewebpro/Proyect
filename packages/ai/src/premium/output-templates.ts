import type { ProductSpec } from '../product-spec-schema';

export const OUTPUT_TEMPLATE_IDS = ['bookings', 'saas_dashboard', 'landing_auth'] as const;
export type OutputTemplateId = (typeof OUTPUT_TEMPLATE_IDS)[number];

export function parseOutputTemplate(raw: string | null | undefined): OutputTemplateId | null {
  if (!raw) return null;
  const k = raw.trim().toLowerCase();
  if (k === 'bookings' || k === 'reservas') return 'bookings';
  if (k === 'saas_dashboard' || k === 'saas' || k === 'dashboard') return 'saas_dashboard';
  if (k === 'landing_auth' || k === 'landing' || k === 'auth_landing') return 'landing_auth';
  return null;
}

/** Heuristic when the client does not send outputTemplate (e.g. older clients). */
export function detectOutputTemplateFromPrompt(prompt: string): OutputTemplateId {
  const p = prompt.toLowerCase();
  if (
    p.includes('saas') ||
    p.includes('dashboard') ||
    p.includes('métrica') ||
    p.includes('metrica') ||
    p.includes('crm') ||
    p.includes('pipeline')
  ) {
    return 'saas_dashboard';
  }
  if (
    p.includes('landing') ||
    p.includes('waitlist') ||
    p.includes('portal') ||
    p.includes('marketing') && (p.includes('auth') || p.includes('login') || p.includes('registro'))
  ) {
    return 'landing_auth';
  }
  return 'bookings';
}

export function templateLabel(id: OutputTemplateId): string {
  switch (id) {
    case 'bookings':
      return 'Reservas + panel';
    case 'saas_dashboard':
      return 'Dashboard SaaS';
    case 'landing_auth':
      return 'Landing + auth';
    default:
      return id;
  }
}

export function planSpecForTemplate(id: OutputTemplateId, userPrompt: string): ProductSpec {
  const base = userPrompt.slice(0, 400);
  switch (id) {
    case 'bookings':
      return {
        title: 'Reservas — experiencia premium',
        pages: [
          { name: 'Panel', path: '/', purpose: 'Resumen y acciones' },
          { name: 'Reservas', path: '/bookings', purpose: 'Tabla, filtros y nueva reserva' },
          { name: 'Admin', path: '/admin', purpose: 'Ajustes simulados' },
        ],
        entities: [
          {
            name: 'Booking',
            fields: [
              { name: 'title', type: 'string', required: true },
              { name: 'guestName', type: 'string', required: false },
              { name: 'startsAt', type: 'datetime', required: true },
              { name: 'status', type: 'string', required: false },
            ],
          },
        ],
        auth: { enabled: true, roles: ['user', 'admin'] },
        api: {
          endpoints: [
            { method: 'GET', path: '/api/app/Booking', entity: 'Booking', action: 'list' },
            { method: 'POST', path: '/api/app/Booking', entity: 'Booking', action: 'create' },
          ],
        },
        integrations: [],
        permissions: ['admin:all', 'user:bookings'],
        metadata: { template: 'bookings', userPrompt: base },
      };
    case 'saas_dashboard':
      return {
        title: 'SaaS — panel de control',
        pages: [
          { name: 'Overview', path: '/', purpose: 'KPIs y gráfico simulado' },
          { name: 'Leads', path: '/leads', purpose: 'Tabla CRM' },
          { name: 'Ajustes', path: '/settings', purpose: 'Preferencias simuladas' },
        ],
        entities: [
          {
            name: 'Lead',
            fields: [
              { name: 'name', type: 'string', required: true },
              { name: 'company', type: 'string', required: false },
              { name: 'email', type: 'string', required: false },
              { name: 'status', type: 'string', required: false },
              { name: 'value', type: 'number', required: false },
            ],
          },
        ],
        auth: { enabled: true, roles: ['user', 'admin'] },
        api: {
          endpoints: [
            { method: 'GET', path: '/api/app/Lead', entity: 'Lead', action: 'list' },
            { method: 'POST', path: '/api/app/Lead', entity: 'Lead', action: 'create' },
          ],
        },
        integrations: ['stripe'],
        permissions: ['admin:all', 'user:leads'],
        metadata: { template: 'saas_dashboard', userPrompt: base },
      };
    case 'landing_auth':
      return {
        title: 'Landing — captación y acceso',
        pages: [
          { name: 'Inicio', path: '/', purpose: 'Hero, prueba social y CTA' },
          { name: 'Lista de espera', path: '/waitlist', purpose: 'Registros públicos' },
          { name: 'Acceso', path: '/auth', purpose: 'Login / registro app' },
        ],
        entities: [
          {
            name: 'WaitlistEntry',
            fields: [
              { name: 'name', type: 'string', required: true },
              { name: 'email', type: 'string', required: true },
              { name: 'role', type: 'string', required: false },
            ],
          },
        ],
        auth: { enabled: true, roles: ['user', 'admin'] },
        api: {
          endpoints: [
            { method: 'GET', path: '/api/app/WaitlistEntry', entity: 'WaitlistEntry', action: 'list' },
            { method: 'POST', path: '/api/app/WaitlistEntry', entity: 'WaitlistEntry', action: 'create' },
          ],
        },
        integrations: [],
        permissions: ['admin:all', 'user:waitlist'],
        metadata: { template: 'landing_auth', userPrompt: base },
      };
    default:
      return planSpecForTemplate('bookings', userPrompt);
  }
}
