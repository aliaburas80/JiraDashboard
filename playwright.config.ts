// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// QA-GATE-05/06: cross-browser + cross-platform/responsive critical-path smoke coverage.
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100';

// MOBILE-05/07/09: these specs assert phone-width-only CSS behavior (the
// dense-table sticky-scroll pattern only activates below ~640px; the
// stacked-grid form pattern targets the `sm` 640px breakpoint) and were
// always intended to run against the `Mobile` project only — their own file
// header comments already said so. Nothing enforced that until now, so they
// were silently also running on Desktop Chrome/Firefox/Safari/Tablet, each
// repeating the full login+password-change+upload setup from scratch for an
// assertion that's meaningless (or, at Tablet's 834px width, potentially
// wrong) outside the Mobile viewport — 2.5x more full auth+upload cycles
// than the suite needs, which is what pushed a slow run past the job's
// timeout-minutes ceiling with nothing left over to even upload a report.
const MOBILE_ONLY_SPECS = ['**/mobile-dense-tables.spec.ts', '**/mobile-forms.spec.ts', '**/mobile-requests.spec.ts'];

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
    { name: 'Desktop Chrome',  testIgnore: MOBILE_ONLY_SPECS, use: { ...devices['Desktop Chrome'] } },
    { name: 'Desktop Firefox', testIgnore: MOBILE_ONLY_SPECS, use: { ...devices['Desktop Firefox'] } },
    { name: 'Desktop Safari',  testIgnore: MOBILE_ONLY_SPECS, use: { ...devices['Desktop Safari'] } },
    { name: 'Tablet',          testIgnore: MOBILE_ONLY_SPECS, use: { ...devices['iPad Pro 11'] } },
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
