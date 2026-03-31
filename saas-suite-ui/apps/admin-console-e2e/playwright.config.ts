import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';
const isCI = !!process.env['CI'];
/** Com frontends já servidos (ex.: up-all.sh: shop 4200, ops 4300, admin 4400). */
const skipWebServer = process.env['E2E_SKIP_WEBSERVER'] === '1';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: 'pnpm exec nx run admin-console:serve',
          url: 'http://localhost:4200',
          reuseExistingServer: !isCI,
          cwd: workspaceRoot,
        },
      }),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
