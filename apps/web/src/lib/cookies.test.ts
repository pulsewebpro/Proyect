import { describe, it, expect } from 'vitest';
import { SESSION_COOKIE_NAME } from '../lib/cookies';

describe('cookies', () => {
  it('exports session cookie name', () => {
    expect(SESSION_COOKIE_NAME).toBe('amable_session');
  });
});
