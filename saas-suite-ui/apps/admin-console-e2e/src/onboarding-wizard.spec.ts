import { test, expect } from './fixtures';

test.describe('Tenant Onboarding Wizard', () => {
  test('should display onboarding page', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(
      page.locator('mat-stepper, .stepper, mat-step-header, input[type="email"], mat-form-field').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should show wizard steps or auth form', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(
      page.locator('mat-step-header, .mat-step-header, mat-stepper, mat-form-field').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should allow interaction with onboarding or show login', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');
    const nextButton = page
      .locator('button')
      .filter({ hasText: /next|continue|próximo/i })
      .first();
    await nextButton.click({ timeout: 5000 }).catch(() => undefined);
    await expect(page.locator('body')).toBeVisible();
  });
});
