import { z } from 'zod';

/** Structured product spec produced by plan mode (LLM or validated mock). */
export const productSpecSchema = z.object({
  title: z.string().min(1),
  pages: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      purpose: z.string().optional(),
    })
  ),
  entities: z.array(
    z.object({
      name: z.string(),
      fields: z.array(
        z.object({
          name: z.string(),
          type: z.enum(['string', 'number', 'boolean', 'datetime']),
          required: z.boolean().optional(),
        })
      ),
    })
  ),
  auth: z.object({
    enabled: z.boolean(),
    roles: z.array(z.string()).default(['user', 'admin']),
  }),
  api: z.object({
    endpoints: z.array(
      z.object({
        method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']),
        path: z.string(),
        entity: z.string().optional(),
        action: z.enum(['list', 'get', 'create', 'update', 'delete']).optional(),
      })
    ),
  }),
  integrations: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export type ProductSpec = z.infer<typeof productSpecSchema>;

export const llmBuildOutputSchema = z.object({
  assistantMessage: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
});

export type LlmBuildOutput = z.infer<typeof llmBuildOutputSchema>;

export const llmPlanOutputSchema = z.object({
  assistantMessage: z.string(),
  spec: productSpecSchema,
});

export type LlmPlanOutput = z.infer<typeof llmPlanOutputSchema>;
