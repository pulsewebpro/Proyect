import { test, expect } from '@playwright/test';

test.describe('flujo completo', () => {
  test('registro → dashboard → proyecto → preview → publicar → sitio público', async ({ page, context }) => {
    const suffix = Date.now();
    const email = `e2e_${suffix}@test.local`;
    const password = 'E2ETest12345!';
    const slug = `e2e-proyecto-${suffix}`;

    await page.goto('/registro');
    await page.getByLabel('Nombre').fill('E2E User');
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(password);
    await page.getByRole('button', { name: 'Crear espacio de trabajo' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    await page.getByPlaceholder('Nombre del proyecto').fill('Proyecto E2E');
    await page.getByPlaceholder('slug-url').fill(slug);
    await page.getByRole('button', { name: 'Crear y abrir' }).click();
    await expect(page).toHaveURL(/\/proyecto\//, { timeout: 15000 });

    await page.getByRole('tab', { name: 'Vista previa' }).click();
    const frame = page.locator('iframe[title="Vista previa"]');
    await expect(frame).toBeVisible({ timeout: 15000 });

    page.on('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Publicar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click();

    const pubPage = await context.newPage();
    await pubPage.goto(`/sitio/${slug}`);
    await expect(pubPage.getByRole('heading', { name: 'Proyecto E2E' })).toBeVisible({ timeout: 15000 });
    const pubFrame = pubPage.locator('iframe[title="Aplicación publicada"]');
    await expect(pubFrame).toBeVisible({ timeout: 15000 });
    await pubPage.close();

    const projectId = page.url().match(/\/proyecto\/([^/?#]+)/)?.[1];
    expect(projectId).toBeTruthy();

    await page.getByRole('tab', { name: 'Analítica' }).click();
    await expect
      .poll(
        async () => {
          const r = await page.request.get(`/api/v1/projects/${projectId}/analytics?range=7d`);
          if (!r.ok()) return 0;
          const j = (await r.json()) as { metrics?: { pageviews?: number } };
          return j.metrics?.pageviews ?? 0;
        },
        { timeout: 20000 }
      )
      .toBeGreaterThanOrEqual(1);
    await expect(page.getByText('Páginas vistas')).toBeVisible();
  });
});
