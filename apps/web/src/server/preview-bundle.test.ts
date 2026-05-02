import { describe, it, expect } from 'vitest';
import { bundleAppForPreview, bundleProjectFiles } from './preview-bundle';

describe('bundleAppForPreview', () => {
  it('bundles a minimal default export', async () => {
    const src = `export default function App() { return <div>ok</div>; }`;
    const { js, errors } = await bundleAppForPreview(src);
    expect(errors).toEqual([]);
    expect(js.length).toBeGreaterThan(100);
    expect(js).toMatch(/root|React/i);
  });

  it('returns errors for invalid syntax', async () => {
    const { errors } = await bundleAppForPreview('export default {{{');
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('bundleProjectFiles', () => {
  it('resolves relative import between files', async () => {
    const { js, errors } = await bundleProjectFiles([
      { path: 'src/App.tsx', content: `import { Title } from './Title';\nexport default function App(){ return <Title />; }` },
      { path: 'src/Title.tsx', content: `export function Title(){ return <h1>x</h1>; }` },
    ]);
    expect(errors).toEqual([]);
    expect(js.length).toBeGreaterThan(200);
  });
});
