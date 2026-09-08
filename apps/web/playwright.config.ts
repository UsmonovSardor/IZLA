import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke testlar — JONLI (yoki E2E_BASE_URL) saytga qarshi ishlaydi.
 * Dev server shart emas: deploy'dan keyingi kritik-oqim tekshiruvi.
 * Ishga tushirish: corepack pnpm --filter @izla/web test:e2e
 */
const BASE_URL = process.env.E2E_BASE_URL || 'https://web-production-66316.up.railway.app';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  retries: 1, // tashqi sayt — bitta qayta urinish (flaky tarmoqqa qarshi)
  workers: 3,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
