import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Onboarding (autenticado)', () => {
  test('mostra o assistente de criação de tenant', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/onboarding');
    await expect(page.getByRole('heading', { name: /Criar Novo Tenant|Create/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('mat-stepper, mat-step-header').first()).toBeVisible({
      timeout: 10000,
    });
  });
});
