import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    headless: false,
    viewport: { width: 420, height: 800 },
    contextOptions: {
      permissions: ['clipboard-read', 'clipboard-write'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
