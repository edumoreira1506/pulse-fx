import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, request }) => {
    await expect(async () => {
      const response = await request.get('http://localhost:3333/');
      expect(response.ok()).toBeTruthy();
    }).toPass({ timeout: 60_000 });

    await page.goto('/');
  });

  test('should display the dashboard title', async ({ page }) => {
    const header = page.locator('h1').first();
    await expect(header).toHaveText('Dashboard - Pulse FX');
  });

  test('should stay on the home route', async ({ page }) => {
    await expect(page).toHaveURL(/\/$/);
  });

  test('should have the dashboard page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Dashboard - Pulse FX/i);
  });

  test('should display the dashboard description', async ({ page }) => {
    const copy = page.locator(
      'p:has-text("Mercados e indicadores macroeconômicos")',
    );
    await expect(copy).toBeVisible();
  });

  test('should display indicator cards from the API', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Dólar \/ Real/ }),
    ).toBeVisible();
  });

  test('should open card history from a card click', async ({ page }) => {
    await page.getByRole('button', { name: /Dólar \/ Real/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Histórico de Dólar \/ Real/ }),
    ).toBeVisible();
    await expect(page).toHaveURL(/card=usd-brl/);
    await expect(page).toHaveURL(/period=LAST_5_BUSINESS_DAY/);
  });

  test('should redirect unknown routes to home', async ({ page }) => {
    await page.goto('/unknown');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1').first()).toHaveText('Dashboard - Pulse FX');
  });
});
