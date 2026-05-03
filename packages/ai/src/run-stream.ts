import type { StreamEvent } from './stream-types';
import { mockRunStream } from './mock-stream';
import { hasAnyLlmKey, isLocalDev, type LlmEnv } from './env';
import { extractJsonObject } from './parse-json-block';
import { llmPlanOutputSchema, llmBuildOutputSchema } from './product-spec-schema';
import { openaiChatCompletion } from './llm-openai';
import { anthropicMessages } from './llm-anthropic';
import { detectOutputTemplateFromPrompt, parseOutputTemplate, type OutputTemplateId } from './premium/output-templates';
import { premiumBuildRules, premiumPlanRules } from './premium/llm-template-rules';

function resolveTemplateId(args: {
  outputTemplate?: string | null;
  prompt: string;
  productSpecSummary?: string;
}): OutputTemplateId {
  const fromField = parseOutputTemplate(args.outputTemplate);
  if (fromField) return fromField;
  if (args.productSpecSummary) {
    try {
      const j = JSON.parse(args.productSpecSummary) as { metadata?: { template?: string } };
      const t = parseOutputTemplate(j.metadata?.template ?? null);
      if (t) return t;
    } catch {
      /* */
    }
  }
  return detectOutputTemplateFromPrompt(args.prompt);
}

const PLAN_SYSTEM = `Eres un arquitecto de producto. Devuelve SOLO un JSON válido con esta forma exacta:
{
  "assistantMessage": "string en español resumiendo el plan",
  "spec": {
    "title": "string",
    "pages": [{ "name": "string", "path": "string", "purpose": "string opcional" }],
    "entities": [{ "name": "string", "fields": [{ "name": "string", "type": "string"|"number"|"boolean"|"datetime", "required": boolean opcional }] }],
    "auth": { "enabled": boolean, "roles": ["user","admin"] },
    "api": { "endpoints": [{ "method": "GET"|"POST"|"PATCH"|"DELETE", "path": "string", "entity": "string opcional", "action": "list"|"get"|"create"|"update"|"delete" opcional }] },
    "integrations": ["stripe"|"supabase"|"github" ...],
    "permissions": ["string"]
  }
}
No markdown fuera del JSON.`;

const BUILD_SYSTEM = `Eres un ingeniero full-stack. Genera archivos para una app React + TypeScript con Vite.
Devuelve SOLO JSON válido:
{
  "assistantMessage": "string en español",
  "files": [{ "path": "string relativo", "content": "string código completo" }]
}
Rutas obligatorias si no existen: vite.config.ts, index.html, src/main.tsx, src/App.tsx, package.json (con react react-dom y devDependencies vite @vitejs/plugin-react typescript).
Para datos del usuario: usa fetch a rutas relativas /api/app/... (el host las proxifica).
Incluye páginas simples con react-router-dom si hay varias páginas en el spec (añade dependencia en package.json).
No incluyas secretos. package.json solo dependencias públicas.`;

async function callLlmJson(env: LlmEnv, system: string, user: string): Promise<string> {
  const openaiKey = (env.openaiApiKey ?? '').trim();
  const anthropicKey = (env.anthropicApiKey ?? '').trim();
  if (openaiKey) {
    return openaiChatCompletion({
      apiKey: openaiKey,
      model: env.openaiModel ?? 'gpt-4o-mini',
      system,
      user,
    });
  }
  if (anthropicKey) {
    return anthropicMessages({
      apiKey: anthropicKey,
      model: env.anthropicModel ?? 'claude-3-5-haiku-20241022',
      system,
      user,
    });
  }
  throw new Error('No LLM API key');
}

export async function* createRunStream(input: {
  mode: 'plan' | 'build';
  prompt: string;
  productSpecSummary?: string;
  outputTemplate?: string | null;
  env?: LlmEnv;
}): AsyncGenerator<StreamEvent> {
  const env: LlmEnv = input.env ?? {
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiModel: process.env.OPENAI_MODEL,
    anthropicModel: process.env.ANTHROPIC_MODEL,
    nodeEnv: process.env.NODE_ENV,
  };

  const templateId = resolveTemplateId({
    outputTemplate: input.outputTemplate,
    prompt: input.prompt,
    productSpecSummary: input.productSpecSummary,
  });

  const useLlm = hasAnyLlmKey(env);
  if (!useLlm) {
    if (!isLocalDev(env)) {
      yield {
        type: 'error',
        message:
          'OPENAI_API_KEY o ANTHROPIC_API_KEY es obligatorio en producción. Configura las variables de entorno.',
      };
      return;
    }
    yield* mockRunStream({ mode: input.mode, prompt: input.prompt, outputTemplate: templateId });
    return;
  }

  yield { type: 'step', name: 'Analizando contexto', status: 'running' };
  yield { type: 'step', name: 'Analizando contexto', status: 'done' };

  try {
    if (input.mode === 'plan') {
      yield { type: 'step', name: 'Especificación de producto', status: 'running' };
      const planSystem = PLAN_SYSTEM + premiumPlanRules(templateId);
      const raw = await callLlmJson(
        env,
        planSystem,
        `Plantilla sugerida: ${templateId}\nPedido del usuario:\n${input.prompt}`
      );
      const parsed = llmPlanOutputSchema.safeParse(extractJsonObject(raw));
      if (!parsed.success) {
        yield { type: 'error', message: `Spec inválida: ${parsed.error.message}` };
        return;
      }
      yield {
        type: 'message',
        role: 'assistant',
        content: `${parsed.data.assistantMessage}\n\n\`\`\`json\n${JSON.stringify(parsed.data, null, 2)}\n\`\`\``,
      };
      yield { type: 'step', name: 'Especificación de producto', status: 'done' };
      yield { type: 'done', creditsUsed: 0.35 };
      return;
    }

    yield { type: 'step', name: 'Generando código', status: 'running' };
    const userPrompt =
      input.productSpecSummary != null
        ? `ProductSpec (JSON):\n${input.productSpecSummary}\n\nTarea:\n${input.prompt}`
        : input.prompt;
    const buildSystem = BUILD_SYSTEM + premiumBuildRules(templateId);
    const raw = await callLlmJson(env, buildSystem, userPrompt);
    const parsed = llmBuildOutputSchema.safeParse(extractJsonObject(raw));
    if (!parsed.success) {
      yield { type: 'error', message: `Salida de build inválida: ${parsed.error.message}` };
      return;
    }
    yield { type: 'message', role: 'assistant', content: parsed.data.assistantMessage };
    for (const f of parsed.data.files) {
      yield { type: 'file', path: f.path, content: f.content };
    }
    yield { type: 'step', name: 'Generando código', status: 'done' };
    yield { type: 'step', name: 'Probando', status: 'running' };
    yield { type: 'step', name: 'Probando', status: 'done' };
    yield { type: 'done', creditsUsed: 1.25 };
  } catch (e) {
    yield { type: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}

/** Parse assistant message (contains JSON block) for ProductSpec persistence. */
export function parsePlanMessageForSpec(content: string) {
  try {
    const obj = extractJsonObject(content);
    return llmPlanOutputSchema.safeParse(obj);
  } catch {
    return llmPlanOutputSchema.safeParse(null);
  }
}
