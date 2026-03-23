import { test, expect } from './fixtures';

test.describe('Tenants Management', () => {
  test('should display tenants list or login', async ({ page }) => {
    await page.goto('/tenants');
    await expect(
      page.locator('table, mat-table, mat-card, mat-form-field, [type="password"]').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should stay on tenants or login route', async ({ page }) => {
    await page.goto('/tenants');
    await expect(page).toHaveURL(/\/(tenants|login)/);
    await expect(page.locator('body')).toBeVisible();
  });
});
