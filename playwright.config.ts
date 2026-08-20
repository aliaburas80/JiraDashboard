// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// QA-GATE-05/06: cross-browser + cross-platform/responsive critical-path smoke coverage.
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100';
const adminBaseURL = (process.env.ADMIN_E2E_BASE_URL ?? 'http://127.0.0.1:3101').replace(/\/$/, '');

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

// EP-026/027 and the Delivery Intelligence product flow: capacity/security
// scenarios and provider-free specialist-agent interaction need one
// representative Chromium run. Cross-browser user-flow correctness remains
// covered by the critical-path suite; multiplying these stateful flows across
// five projects adds cost without strengthening their specific guarantees.
const DESKTOP_CHROME_ONLY_SPECS = [
  '**/performance-capacity.spec.ts',
  '**/admin-security-regression.spec.ts',
  '**/intelligence.spec.ts',
];
const NON_CHROME_IGNORES = [...MOBILE_ONLY_SPECS, ...DESKTOP_CHROME_ONLY_SPECS];

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
    { name: 'Desktop Firefox', testIgnore: NON_CHROME_IGNORES, use: { ...devices['Desktop Firefox'] } },
    { name: 'Desktop Safari',  testIgnore: NON_CHROME_IGNORES, use: { ...devices['Desktop Safari'] } },
    { name: 'Tablet',          testIgnore: NON_CHROME_IGNORES, use: { ...devices['iPad Pro 11'] } },
    { name: 'Mobile',          testIgnore: DESKTOP_CHROME_ONLY_SPECS, use: { ...devices['iPhone 13'] } },
  ],

  // EP-027: CI now boots both independently built production runtimes. The
  // user app remains on 3100; the separate Admin application is on 3101 and
  // is considered ready only when its own public health endpoint responds.
  // Both processes share the same real PostgreSQL test database but use
  // different session cookie names and different session secrets.
  webServer: process.env.E2E_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'npm run start',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: { PORT: '3100' },
        },
        {
          command: 'npx next start admin-app -p 3101',
          url: `${adminBaseURL}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
