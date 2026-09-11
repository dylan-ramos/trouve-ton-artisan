import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  reporter: [
    ['list'],
    ['json', { outputFile: 'audit-results/playwright.json' }],
  ],
  outputDir: 'audit-results/artifacts',
  use: {
    baseURL: process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:5180',
    channel: process.env.BROWSER_CHANNEL ?? 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
