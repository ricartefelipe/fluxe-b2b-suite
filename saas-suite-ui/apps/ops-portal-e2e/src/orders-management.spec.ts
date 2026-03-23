import { test, expect } from './fixtures';

test.describe('Orders Management', () => {
  test('should navigate to orders page', async ({ page }) => {
    await page.goto('/orders');
    await expect(
      page.locator('table, mat-table, .orders, mat-form-field, [type="password"]').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to create order page', async ({ page }) => {
    await page.goto('/orders/new');
    await expect(
      page.locator('form, mat-form-field, [type="password"]').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
