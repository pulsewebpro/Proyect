import { describe, expect, it } from 'vitest';
import { mockViteProjectFiles } from './mock-vite-skeleton';

describe('mockViteProjectFiles', () => {
  it('returns a minimal Vite-shaped tree with a test id in App', () => {
    const files = mockViteProjectFiles('app de reservas e2e');
    const paths = files.map((f) => f.path).sort();
    expect(paths).toContain('package.json');
    expect(paths).toContain('vite.config.ts');
    expect(paths).toContain('index.html');
    expect(paths).toContain('src/main.tsx');
    expect(paths).toContain('src/App.tsx');
    const app = files.find((f) => f.path === 'src/App.tsx')?.content ?? '';
    expect(app).toContain('data-testid="e2e-generated-root"');
    expect(app).toContain('app de reservas e2e');
  });
});
