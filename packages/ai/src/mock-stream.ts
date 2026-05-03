import type { StreamEvent } from './stream-types';
import { mockPremiumViteFiles } from './premium/mock-premium-build';
import {
  detectOutputTemplateFromPrompt,
  planSpecForTemplate,
  type OutputTemplateId,
} from './premium/output-templates';

export type { StreamEvent };

/** Deterministic mock stream for Plan vs Build modes when no LLM keys (local only). */
export async function* mockRunStream(input: {
  mode: 'plan' | 'build';
  prompt: string;
  outputTemplate?: OutputTemplateId | null;
}): AsyncGenerator<StreamEvent> {
  const template = input.outputTemplate ?? detectOutputTemplateFromPrompt(input.prompt);

  yield { type: 'step', name: 'Analizando contexto', status: 'running' };
  await delay(400);
  yield { type: 'step', name: 'Analizando contexto', status: 'done' };

  if (input.mode === 'plan') {
    const spec = planSpecForTemplate(template, input.prompt);
    const planOut = {
      assistantMessage: `Plan (${template}, mock local sin OPENAI/ANTHROPIC). Pedido: ${input.prompt.slice(0, 200)}`,
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
  for (const f of mockPremiumViteFiles(template, input.prompt)) {
    yield { type: 'file', path: f.path, content: f.content };
  }
  yield { type: 'step', name: 'Generando cambios', status: 'done' };
  yield { type: 'step', name: 'Probando', status: 'running' };
  await delay(300);
  yield { type: 'step', name: 'Probando', status: 'done' };
  yield { type: 'message', role: 'assistant', content: 'Plantilla premium aplicada y probada en vista previa.' };
  yield { type: 'done', creditsUsed: 1 };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
