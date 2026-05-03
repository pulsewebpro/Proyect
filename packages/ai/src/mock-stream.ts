import type { StreamEvent } from './stream-types';
import { mockViteProjectFiles } from './mock-vite-skeleton';

export type { StreamEvent };

/** Deterministic mock stream for Plan vs Build modes when no LLM keys (local only). */
export async function* mockRunStream(input: {
  mode: 'plan' | 'build';
  prompt: string;
}): AsyncGenerator<StreamEvent> {
  yield { type: 'step', name: 'Analizando contexto', status: 'running' };
  await delay(400);
  yield { type: 'step', name: 'Analizando contexto', status: 'done' };

  if (input.mode === 'plan') {
    const spec = {
      title: 'App demo (mock local)',
      pages: [
        { name: 'Inicio', path: '/', purpose: 'Landing' },
        { name: 'Reservas', path: '/bookings', purpose: 'Listado' },
      ],
      entities: [
        {
          name: 'Booking',
          fields: [
            { name: 'title', type: 'string' as const, required: true },
            { name: 'startsAt', type: 'datetime' as const, required: true },
          ],
        },
      ],
      auth: { enabled: true, roles: ['user', 'admin'] },
      api: {
        endpoints: [
          { method: 'GET' as const, path: '/api/app/bookings', entity: 'Booking', action: 'list' as const },
          { method: 'POST' as const, path: '/api/app/bookings', entity: 'Booking', action: 'create' as const },
        ],
      },
      integrations: [],
      permissions: ['admin:all', 'user:read_own'],
    };
    const planOut = {
      assistantMessage: `Especificación generada (mock local sin OPENAI/ANTHROPIC). Pedido: ${input.prompt.slice(0, 200)}`,
      spec,
    };
    yield {
      type: 'message',
      role: 'assistant',
      content: `${planOut.assistantMessage}\n\n\`\`\`json\n${JSON.stringify(planOut, null, 2)}\n\`\`\``,
    };
    yield { type: 'done', creditsUsed: 0.25 };
    return;
  }

  yield { type: 'step', name: 'Generando cambios', status: 'running' };
  await delay(500);
  for (const f of mockViteProjectFiles(input.prompt)) {
    yield { type: 'file', path: f.path, content: f.content };
  }
  yield { type: 'step', name: 'Generando cambios', status: 'done' };
  yield { type: 'step', name: 'Probando', status: 'running' };
  await delay(300);
  yield { type: 'step', name: 'Probando', status: 'done' };
  yield { type: 'message', role: 'assistant', content: 'Cambios aplicados y probados en vista previa.' };
  yield { type: 'done', creditsUsed: 1 };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
