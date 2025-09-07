import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
});

