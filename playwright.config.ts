// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// QA-GATE-05/06: cross-browser + cross-platform/responsive critical-path smoke coverage.
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './tests/e2e',
  // Generous enough that the per-step waits in tests/e2e/helpers/auth.ts
  // (up to 40s for a cold-start upload→dashboard redirect) are always the
  // real constraint, never this outer test-level budget.
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // QA-GATE-05: Chromium, Firefox, and WebKit at a shared desktop viewport.
  // QA-GATE-06: the same critical path at tablet and mobile viewports/devices.
  projects: [
    { name: 'Desktop Chrome',  use: { ...devices['Desktop Chrome'] } },
    { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Desktop Safari',  use: { ...devices['Desktop Safari'] } },
    { name: 'Tablet',          use: { ...devices['iPad Pro 11'] } },
    { name: 'Mobile',          use: { ...devices['iPhone 13'] } },
  ],

  // Reused by CI (a real Postgres-backed server) and, optionally, local dev.
  // PORT is read by scripts/start-production.mjs, which also runs
  // `prisma migrate deploy` before starting `next start` — no separate
  // migration step is needed here as long as DATABASE_URL is already set.
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { PORT: '3100' },
      },
});
