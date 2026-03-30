import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Assistente IA', () => {
  test('deve carregar a página ou login', async ({ page }) => {
    await page.goto('/ai');
    await expect(
      page.locator('h1, mat-card, mat-form-field, [type="password"]').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('após login dev, exibe o título Assistente IA', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/ai');
    await expect(page.getByRole('heading', { name: /Assistente IA/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('após login dev, envia mensagem no chat e recebe resposta mock', async ({ page }) => {
    await loginWithQuickProfile(page, 'Super Admin');
    await page.goto('/ai');
    await page.getByPlaceholder(/anomalias|anomalies/i).fill('e2e ping');
    await page.locator('.chat-input button[mat-fab]').click();
    await expect(page.getByText(/mock E2E|mock e2e/i)).toBeVisible({ timeout: 15000 });
  });
});
