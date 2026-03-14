import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for trade comparison tests between UAT and Production.
 * Environment is selected by setting the ENV variable before running tests:
 *   ENV=uat  npx playwright test
 *   ENV=prod npx playwright test
 */

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
