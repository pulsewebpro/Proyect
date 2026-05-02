import { test, expect } from '@playwright/test';

test.describe('flujo completo', () => {
  test('registro → dashboard → proyecto → vista previa', async ({ page }) => {
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
  });
});
