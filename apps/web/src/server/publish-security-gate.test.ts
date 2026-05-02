import { describe, expect, it } from 'vitest';
import { runPublishPackageJsonGate } from './publish-security-gate';

describe('runPublishPackageJsonGate', () => {
  it('allows when no package.json', () => {
    const r = runPublishPackageJsonGate([{ path: 'src/App.tsx', content: 'x' }]);
    expect(r.blocked).toBe(false);
    expect(r.findings).toHaveLength(0);
  });

  it('blocks invalid JSON', () => {
    const r = runPublishPackageJsonGate([{ path: 'package.json', content: '{ bad' }]);
    expect(r.blocked).toBe(true);
    expect(r.findings[0]?.code).toBe('package_json_invalid');
  });

  it('blocks file: dependency', () => {
    const pkg = JSON.stringify({
      dependencies: { mylib: 'file:../mylib' },
    });
    const r = runPublishPackageJsonGate([{ path: 'package.json', content: pkg }]);
    expect(r.blocked).toBe(true);
    expect(r.findings.some((f) => f.code === 'dep_file_protocol')).toBe(true);
  });

  it('passes clean package.json', () => {
    const pkg = JSON.stringify({
      name: 'x',
      private: true,
      dependencies: { react: '^19.0.0' },
    });
    const r = runPublishPackageJsonGate([{ path: 'package.json', content: pkg }]);
    expect(r.blocked).toBe(false);
    expect(r.findings).toHaveLength(0);
  });
});
