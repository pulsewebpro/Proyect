import { describe, expect, it } from 'vitest';
import { resolveProjectIdForGeneratedApi } from './generated-api-context';

describe('resolveProjectIdForGeneratedApi', () => {
  it('parses proyecto path from referer', async () => {
    const req = new Request('http://x/api/app/x', {
      headers: { referer: 'http://x/proyecto/clxyz123' },
    });
    const id = await resolveProjectIdForGeneratedApi(req);
    expect(id).toBe('clxyz123');
  });
});
