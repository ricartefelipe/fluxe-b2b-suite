import { test, expect } from './fixtures';
import { loginWithQuickProfile } from './dev-login.helper';

test.describe('Shop landing e catálogo', () => {
  test('landing pública: hero e rodapé', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('h1.hero-title')).toContainText('Fluxe B2B Suite');
    await expect(page.locator('footer.landing-footer')).toContainText('© 2026 Fluxe B2B Suite');
  });

  test('com sessão: cabeçalho e navegação para produtos', async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
    await page.goto('/products');
    await expect(
      page.getByRole('link', { name: /Todos os Produtos|All Products|Products/i })
    ).toBeVisible();
    await expect(page.locator('.logo-name')).toContainText('Fluxe');
  });

  test('com sessão: raiz redireciona para /products', async ({ page }) => {
    await loginWithQuickProfile(page, 'Viewer');
    await page.goto('/');
    await page.waitForURL(/\/products/, { timeout: 15000 });
    await expect(page.locator('.catalog-layout')).toBeVisible();
    await expect(page.locator('article.product-card').first()).toBeVisible();
  });

  test('título da página contém referência ao shop', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page).toHaveTitle(/shop|Fluxe/i);
  });
});
