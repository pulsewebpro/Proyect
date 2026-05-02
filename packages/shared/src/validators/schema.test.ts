import { describe, it, expect } from 'vitest';
import { createRunSchema } from './index';

describe('createRunSchema', () => {
  it('accepts valid run', () => {
    const r = createRunSchema.parse({
      mode: 'plan',
      prompt: 'Hola',
    });
    expect(r.mode).toBe('plan');
  });
});
