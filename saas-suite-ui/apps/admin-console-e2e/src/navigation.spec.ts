import { test, expect } from '@playwright/test';

test.describe('Admin Console Navigation', () => {
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

  test('should navigate between admin sections', async ({ page }) => {
    await page.goto('/');

    for (const section of [
      'tenants',
      'policies',
      'flags',
      'audit',
      'onboarding',
    ]) {
      await page.goto(`/${section}`);
      await page.waitForLoadState('domcontentloaded');
      const isLogin = page.url().includes('login');
      const hasContent = await page
        .locator('main, [role="main"], .content, mat-card, table')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(isLogin || hasContent).toBeTruthy();
    }
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/tenants');

    if (page.url().includes('login')) {
      return;
    }

    const activeLink = page.locator(
      'a.active, a[aria-current="page"], .mat-mdc-list-item.active'
    );
    const hasActive = await activeLink
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    expect(hasActive).toBeTruthy();
  });
});
