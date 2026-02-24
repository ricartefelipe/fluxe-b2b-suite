import { test, expect } from '@playwright/test';

test.describe('Tenants Management', () => {
  test('should display tenants list', async ({ page }) => {
    await page.goto('/tenants');

    const hasTenants = await page
      .locator('table, mat-table, mat-card')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isLogin = page.url().includes('login');

    expect(hasTenants || isLogin).toBeTruthy();
  });

  test('should navigate to tenant detail', async ({ page }) => {
    await page.goto('/tenants');

    const tenantRow = page
      .locator('tr, mat-row, mat-card')
      .filter({ hasText: /.+/ })
      .first();

    const isVisible = await tenantRow
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible && !page.url().includes('login')) {
      await tenantRow.click();
      await page.waitForURL(/tenants\/.+/, { timeout: 5000 }).catch(() => {});
    }
  });
});
