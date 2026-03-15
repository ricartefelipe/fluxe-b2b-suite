import { test, expect } from '@playwright/test';

test.describe('Ops Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const loginBtn = page
      .locator('button')
      .filter({ hasText: /login|admin|operator/i })
      .first();

    const visible = await loginBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      await loginBtn.click();
      await page.waitForURL(/(dashboard|orders)/, { timeout: 5000 }).catch(() => undefined);
    }
  });

  test('should display KPI cards', async ({ page }) => {
    await page.goto('/dashboard');

    const cards = page.locator('mat-card, .kpi-card, .dashboard-card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display charts section', async ({ page }) => {
    await page.goto('/dashboard');

    const hasSvg = await page
      .locator('svg')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasTable = await page
      .locator('mat-table, table')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasSvg || hasTable).toBeTruthy();
  });
});
