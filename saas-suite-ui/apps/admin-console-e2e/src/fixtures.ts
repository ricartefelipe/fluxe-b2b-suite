import { test as base, expect } from '@playwright/test';
import { installCoreE2eMocks } from './install-core-mocks';

export const test = base.extend({
  page: async ({ page }, use) => {
    await installCoreE2eMocks(page);
    await use(page);
  },
});

export { expect };
