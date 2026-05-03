import { z } from 'zod';

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/),
  workspaceId: z.string().cuid(),
  folderId: z.string().cuid().optional(),
});

export const createRunSchema = z.object({
  mode: z.enum(['plan', 'build']),
  prompt: z.string().min(1).max(16000),
  attachments: z.array(z.string().url()).optional().default([]),
  references: z.array(z.string().cuid()).optional().default([]),
  providerPreference: z.enum(['auto', 'anthropic', 'openai']).optional().default('auto'),
});

export const publishProjectSchema = z.object({
  audience: z.enum(['workspace', 'anyone']),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  runSecurityCheck: z.boolean().default(true),
  primaryDomain: z.string().optional(),
});

export const commentCreateSchema = z.object({
  body: z.string().min(1).max(8000),
  anchorSelector: z.string().max(512).optional(),
  threadId: z.string().cuid().optional(),
});

export type CreateRunInput = z.infer<typeof createRunSchema>;
