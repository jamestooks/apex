import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  retries: 1,
  workers: 2,
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'node scripts/serve.mjs 4173', port: 4173, reuseExistingServer: true, stdout: 'ignore', stderr: 'ignore' },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'tablet', testMatch: /devices\.spec/, use: { ...devices['iPad (gen 7)'], browserName: 'chromium' } },
    { name: 'desktop', testMatch: /devices\.spec/, use: { viewport: { width: 1280, height: 800 }, browserName: 'chromium' } },
  ],
});
