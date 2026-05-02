import type { StreamEvent } from './stream-types';

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
  yield {
    type: 'file',
    path: 'src/App.tsx',
    content: `export const greeting = "${input.prompt.slice(0, 40).replace(/"/g, '')}";\n\nexport default function App() {\n  return (\n    <main style={{ fontFamily: 'system-ui', padding: 24 }}>\n      <h1>Vista previa Amable Studio</h1>\n      <p>{greeting}</p>\n    </main>\n  );\n}\n`,
  };
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
