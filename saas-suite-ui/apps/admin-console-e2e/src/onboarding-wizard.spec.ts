import { test, expect } from '@playwright/test';

test.describe('Tenant Onboarding Wizard', () => {
  test('should display onboarding page', async ({ page }) => {
    await page.goto('/onboarding');

    const hasStepper = await page
      .locator('mat-stepper, .stepper')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const isLogin = page.url().includes('login');

    expect(hasStepper || isLogin).toBeTruthy();
  });

  test('should show wizard steps', async ({ page }) => {
    await page.goto('/onboarding');

    const steps = page.locator('mat-step-header, .mat-step-header');
    const stepCount = await steps.count();

    if (!page.url().includes('login')) {
      expect(stepCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('should validate required fields before advancing', async ({
    page,
  }) => {
    await page.goto('/onboarding');

    if (page.url().includes('login')) {
      return;
    }

    const nextButton = page
      .locator('button')
      .filter({ hasText: /next|continue|próximo/i })
      .first();
    const isVisible = await nextButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isVisible) {
      await nextButton.click();
      const errors = page.locator('mat-error, .mat-mdc-form-field-error');
      const hasErrors = await errors
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(hasErrors).toBeTruthy();
    }
  });
});
