import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', '..', '..', 'docs', 'screens');
mkdirSync(outDir, { recursive: true });

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/usr/local/bin/google-chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto(base, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: join(outDir, 'landing.png'), fullPage: true });
    console.log('Captura:', join(outDir, 'landing.png'));
  } catch (e) {
    console.warn('No se pudo capturar (¿servidor arriba?):', e);
  }
  await browser.close();
}

void main();
