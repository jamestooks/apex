import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  retries: 1,
  workers: 2,
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'python3 -m http.server 4173', port: 4173, reuseExistingServer: true, stdout: 'ignore', stderr: 'ignore' },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
});
