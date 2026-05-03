import { describe, expect, it } from 'vitest';
import { llmPlanOutputSchema } from './product-spec-schema';
import { parsePlanMessageForSpec } from './run-stream';

describe('parsePlanMessageForSpec', () => {
  it('parses JSON block in assistant message', () => {
    const payload = {
      assistantMessage: 'Hola',
      spec: {
        title: 'Reservas',
        pages: [{ name: 'Inicio', path: '/' }],
        entities: [{ name: 'Booking', fields: [{ name: 't', type: 'string' as const }] }],
        auth: { enabled: true, roles: ['user', 'admin'] },
        api: { endpoints: [{ method: 'GET' as const, path: '/api/app/x' }] },
        integrations: [],
        permissions: [],
      },
    };
    const msg = `Intro\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``;
    const r = parsePlanMessageForSpec(msg);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.spec.title).toBe('Reservas');
  });

  it('validates schema', () => {
    const r = llmPlanOutputSchema.safeParse({
      assistantMessage: 'x',
      spec: {
        title: 'T',
        pages: [],
        entities: [],
        auth: { enabled: false, roles: ['user'] },
        api: { endpoints: [] },
      },
    });
    expect(r.success).toBe(true);
  });
});
