import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the dashboard title', async ({ page }) => {
    const header = page.locator('h1').first();
    await expect(header).toHaveText('Dashboard');
  });

  test('should stay on the home route', async ({ page }) => {
    await expect(page).toHaveURL(/\/$/);
  });

  test('should have the dashboard page title', async ({ page }) => {
    await expect(page).toHaveTitle(/dashboard/i);
  });

  test('should display the dashboard copy', async ({ page }) => {
    const copy = page.locator('p:has-text("Lorem ipsum dolor sit amet")');
    await expect(copy).toBeVisible();
  });

  test('should redirect unknown routes to home', async ({ page }) => {
    await page.goto('/unknown');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1').first()).toHaveText('Dashboard');
  });
});
