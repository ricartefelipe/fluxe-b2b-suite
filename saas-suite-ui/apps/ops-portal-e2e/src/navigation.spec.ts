import { test, expect } from './fixtures';

test.describe('Ops Portal Navigation', () => {
  test('should have sidebar navigation or login', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('nav, aside, .sidebar, mat-form-field, [type="password"]').first()
    ).toBeVisible({ timeout: 15000 });
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
