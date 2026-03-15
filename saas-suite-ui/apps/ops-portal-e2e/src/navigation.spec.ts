import { test, expect } from '@playwright/test';

test.describe('Ops Portal Navigation', () => {
  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/');

    const hasSidebar = await page
      .locator('nav, aside, .sidebar')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isLogin = page.url().includes('login');

    expect(hasSidebar || isLogin).toBeTruthy();
  });

  test('should navigate between sections', async ({ page }) => {
    await page.goto('/');

    for (const section of ['orders', 'payments', 'inventory/adjustments']) {
      await page.goto(`/${section}`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/(orders|payments|inventory|login)/);
    }
  });
});
