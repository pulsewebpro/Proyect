import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);

function hashFiles(files: { path: string; content: string }[]): string {
  let h = 0;
  for (const f of files) {
    if (!isViteRelevantPath(f.path)) continue;
    for (let i = 0; i < f.content.length; i++) h = (Math.imul(31, h) + f.content.charCodeAt(i)) | 0;
    for (let i = 0; i < f.path.length; i++) h = (Math.imul(31, h) + f.path.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

function isViteRelevantPath(p: string): boolean {
  const n = p.replace(/\\/g, '/');
  if (
    n === 'package.json' ||
    n === 'vite.config.ts' ||
    n === 'vite.config.js' ||
    n === 'tsconfig.json' ||
    n === 'index.html'
  )
    return true;
  return n.startsWith('src/');
}

function parsePkg(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function projectUsesVite(files: { path: string; content: string }[]): boolean {
  const pkg = files.find((f) => f.path === 'package.json');
  if (!pkg) return false;
  const j = parsePkg(pkg.content);
  const deps = {
    ...(j.dependencies as Record<string, string> | undefined),
    ...(j.devDependencies as Record<string, string> | undefined),
  };
  return Boolean(deps.vite);
}

export function viteContentHash(files: { path: string; content: string }[]): string {
  return hashFiles(files);
}

export function viteDistPath(projectId: string, contentHash: string): string {
  return path.join(os.tmpdir(), 'amable-vite-store', projectId, contentHash, 'dist');
}

type ViteBuildResult =
  | { ok: true; distDir: string; indexHtml: string; contentHash: string }
  | { ok: false; reason: string };

export async function buildViteProjectIfApplicable(
  projectId: string,
  files: { path: string; content: string }[],
  opts?: { skip?: boolean }
): Promise<ViteBuildResult> {
  if (opts?.skip || process.env.AMABLE_SKIP_VITE === '1') {
    return { ok: false, reason: 'vite_skipped_by_env' };
  }
  if (!projectUsesVite(files)) {
    return { ok: false, reason: 'no_vite_in_package_json' };
  }

  const contentHash = viteContentHash(files);
  const distDir = viteDistPath(projectId, contentHash);
  const indexPath = path.join(distDir, 'index.html');
  try {
    const existing = await fs.readFile(indexPath, 'utf8');
    return { ok: true, distDir, indexHtml: existing, contentHash };
  } catch {
    /* build */
  }

  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'amable-vite-work-'));
  try {
    for (const f of files) {
      if (!isViteRelevantPath(f.path) && !f.path.replace(/\\/g, '/').startsWith('public/')) continue;
      const rel = f.path.replace(/\\/g, '/');
      const full = path.join(work, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, f.content, 'utf8');
    }

    const pkgPath = path.join(work, 'package.json');
    const pkgRaw = await fs.readFile(pkgPath, 'utf8').catch(() => '');
    if (!pkgRaw) {
      await fs.rm(work, { recursive: true, force: true }).catch(() => {});
      return { ok: false, reason: 'missing_package.json' };
    }
    const pkg = parsePkg(pkgRaw);
    pkg.devDependencies = {
      ...((pkg.devDependencies as object) ?? {}),
      vite: '^6.0.11',
      '@vitejs/plugin-react': '^4.3.4',
      typescript: '^5.7.2',
    };
    pkg.dependencies = {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      ...((pkg.dependencies as object) ?? {}),
    };
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        strict: true,
        noEmit: true,
      },
      include: ['src'],
    };
    await fs.writeFile(path.join(work, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2), 'utf8');

    await execFileAsync('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: work,
      timeout: 240_000,
      env: { ...process.env, NODE_ENV: 'development' },
    });
    await execFileAsync('npx', ['vite', 'build'], {
      cwd: work,
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'production' },
    });

    const builtDist = path.join(work, 'dist');
    await fs.mkdir(path.dirname(distDir), { recursive: true });
    await fs.rm(distDir, { recursive: true, force: true }).catch(() => {});
    await fs.cp(builtDist, distDir, { recursive: true });
    const indexHtml = await fs.readFile(indexPath, 'utf8');
    return { ok: true, distDir, indexHtml, contentHash };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: msg.slice(0, 400) };
  } finally {
    await fs.rm(work, { recursive: true, force: true }).catch(() => {});
  }
}

export function rewriteViteIndexHtml(html: string, assetBase: string): string {
  return html
    .replace(/src="\/([^"]+)"/g, (_, p: string) => `src="${assetBase}${p}"`)
    .replace(/href="\/([^"]+)"/g, (_, p: string) => `href="${assetBase}${p}"`);
}

export async function readViteAsset(projectId: string, contentHash: string, rel: string): Promise<Buffer | null> {
  const root = viteDistPath(projectId, contentHash);
  const full = path.join(root, rel);
  if (!full.startsWith(path.resolve(root))) return null;
  try {
    return await fs.readFile(full);
  } catch {
    return null;
  }
}

export async function readViteIndexHtml(projectId: string, contentHash: string): Promise<string | null> {
  const root = viteDistPath(projectId, contentHash);
  try {
    return await fs.readFile(path.join(root, 'index.html'), 'utf8');
  } catch {
    return null;
  }
}
