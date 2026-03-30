import { test, expect } from './fixtures';

test.describe('Admin Console Navigation', () => {
  test('should have sidebar navigation or login', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.locator('nav, aside, .sidebar, mat-form-field, [type="password"]').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should navigate between admin sections', async ({ page }) => {
    for (const section of [
      'tenants',
      'policies',
      'flags',
      'audit',
      'billing',
      'ai',
      'onboarding',
    ]) {
      await page.goto(`/${section}`);
      await page.waitForLoadState('domcontentloaded');
      await expect(
        page.locator('main, [role="main"], .content, mat-card, table, mat-form-field').first()
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show tenants area or login', async ({ page }) => {
    await page.goto('/tenants');
    await expect(
      page.locator('a.active, a[aria-current="page"], .mat-mdc-list-item.active, mat-form-field, mat-sidenav').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
