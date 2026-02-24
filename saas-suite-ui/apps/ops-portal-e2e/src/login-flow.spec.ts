import { test, expect } from '@playwright/test';

test.describe('Ops Portal Login', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button, mat-card')).toBeVisible();
  });

  test('should login with dev credentials', async ({ page }) => {
    await page.goto('/login');

    const devLogin = page
      .locator('button')
      .filter({ hasText: /login|sign in|admin|operator/i })
      .first();

    if (await devLogin.isVisible()) {
      await devLogin.click();
      await page.waitForURL(/(dashboard|orders)/);
    }
  });
});
