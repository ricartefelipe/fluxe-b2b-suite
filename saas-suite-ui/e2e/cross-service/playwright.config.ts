import { defineConfig, devices } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

export default defineConfig({
  testDir: './specs',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: process.env['CI']
    ? [['html', { open: 'never' }], ['junit', { outputFile: 'results/junit.xml' }]]
    : [['html', { open: 'on-failure' }]],
  outputDir: './results/artifacts',

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },

  webServer: {
    command: 'npx nx run ops-portal:serve',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    cwd: workspaceRoot,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
