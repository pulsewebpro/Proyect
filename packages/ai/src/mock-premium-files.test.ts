import { describe, expect, it } from 'vitest';
import { mockPremiumViteFiles } from './premium/mock-premium-build';

describe('mockPremiumViteFiles', () => {
  it('bookings: Vite tree + router + premium markers', () => {
    const files = mockPremiumViteFiles('bookings', 'app de reservas e2e');
    const paths = files.map((f) => f.path).sort();
    expect(paths).toContain('package.json');
    expect(paths).toContain('src/index.css');
    const app = files.find((f) => f.path === 'src/App.tsx')?.content ?? '';
    const main = files.find((f) => f.path === 'src/main.tsx')?.content ?? '';
    expect(app).toContain('data-testid="e2e-generated-root"');
    expect(main).toContain('HashRouter');
    expect(app).toContain('app de reservas e2e');
  });

  it('saas_dashboard: includes Lead API', () => {
    const files = mockPremiumViteFiles('saas_dashboard', 'crm demo');
    const app = files.find((f) => f.path === 'src/App.tsx')?.content ?? '';
    expect(app).toContain('/api/app/Lead');
  });
});
