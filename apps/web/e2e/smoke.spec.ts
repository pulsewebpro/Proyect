import { test, expect } from '@playwright/test';

test('landing tiene CTAs en español', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Empieza con una idea' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Empieza gratis' })).toBeVisible();
});
