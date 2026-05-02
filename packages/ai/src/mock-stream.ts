export type StreamEvent =
  | { type: 'step'; name: string; status: string }
  | { type: 'message'; role: 'assistant'; content: string }
  | { type: 'diff'; path: string; patch: string }
  | { type: 'done'; creditsUsed: number }
  | { type: 'error'; message: string };

/** Deterministic mock stream for Plan vs Build modes (replace with real LLM calls). */
export async function* mockRunStream(input: {
  mode: 'plan' | 'build';
  prompt: string;
}): AsyncGenerator<StreamEvent> {
  yield { type: 'step', name: 'Analizando contexto', status: 'running' };
  await delay(400);
  yield { type: 'step', name: 'Analizando contexto', status: 'done' };

  if (input.mode === 'plan') {
    yield {
      type: 'message',
      role: 'assistant',
      content:
        'Plan propuesto (no se modifica código hasta aprobación):\n\n1) Revisar requisitos\n2) Diseñar modelo de datos\n3) Implementar en fases\n\nAprueba para pasar a Construir.',
    };
    yield { type: 'done', creditsUsed: 0.25 };
    return;
  }

  yield { type: 'step', name: 'Generando cambios', status: 'running' };
  await delay(500);
  yield {
    type: 'diff',
    path: 'src/App.tsx',
    patch: `+ export const greeting = "${input.prompt.slice(0, 40).replace(/"/g, '')}";`,
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
