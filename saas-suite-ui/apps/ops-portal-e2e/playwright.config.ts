import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';
const isCI = !!process.env['CI'];
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
          command: 'pnpm exec nx run ops-portal:serve',
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
