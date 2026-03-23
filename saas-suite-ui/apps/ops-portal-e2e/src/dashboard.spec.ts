import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Ops Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithQuickProfile(page, 'Ops User');
  });

  test('should display KPI cards', async ({ page }) => {
    await page.goto('/dashboard');

    const cards = page.locator('mat-card, .kpi-card, .dashboard-card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display charts section', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(
      page.locator('svg, mat-table, table, canvas').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
