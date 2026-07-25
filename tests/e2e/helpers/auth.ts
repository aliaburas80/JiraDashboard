// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Shared login/upload flow for E2E specs — extracted from critical-path.spec.ts
// so mobile-viewport specs (MOBILE-09) don't duplicate it. Expects a
// freshly-seeded admin account (prisma/seed.mjs) with mustChangePassword: true.
import type { Page } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@deliveryclarity.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@DC2025';
const NEW_PASSWORD = 'E2e-rotated-password-2';

/**
 * Logs in as the seeded admin, resolves the forced password change, and
 * ensures a Jira export is uploaded so the dashboard (and any route reading
 * dashboard data) is populated. Idempotent — safe to call on a repeat run.
 */
// CI runs against a freshly booted `next start` process on every job: the
// first hit to any given route pays a one-time cost that later requests
// don't (Next.js loading that route's dynamically-imported chunks for the
// first time, Prisma's query engine opening its first connection to the
// Postgres service container, bcryptjs doing a synchronous 12-round hash on
// a shared CI vCPU). Login is the very first authenticated request of the
// whole suite, so it eats the full cold-start cost — observed timing out at
// the previous 15s/20s budgets in real GitHub Actions runs even though the
// same flow is fast against an already-warm server. These budgets are
// intentionally generous rather than tuned tight, since this is test-infra
// tolerance for one-time warm-up cost, not a product performance SLA.
const COLD_START_NAV_TIMEOUT_MS = 30_000;
const UPLOAD_NAV_TIMEOUT_MS     = 40_000;

// Every test in the suite shares one seeded admin row in the same CI
// Postgres database (only the browser context is fresh per test, not the
// account) — so once any earlier test in this run completes the forced
// password-change flow below, the account's real password is NEW_PASSWORD,
// not the original ADMIN_PASSWORD. This was the actual root cause of every
// test after the first one deterministically failing at this exact login
// step (confirmed via the login API's own response status, not just a UI
// timeout): they kept trying the now-stale original password, which the
// server correctly rejects, so the page never leaves /login no matter how
// long you wait. Try the original password first (matches a fresh seed),
// and fall back to the rotated one if the server says it was wrong.
async function attemptLogin(page: Page, password: string): Promise<boolean> {
  await page.getByLabel('Password', { exact: true }).fill(password);
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.request().method() === 'POST'),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
  return response.ok();
}

export async function loginAndEnsureData(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(ADMIN_EMAIL);

  const loggedIn = await attemptLogin(page, ADMIN_PASSWORD);
  if (!loggedIn) {
    await attemptLogin(page, NEW_PASSWORD);
  }

  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: COLD_START_NAV_TIMEOUT_MS });

  if (page.url().includes('/change-password')) {
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill(ADMIN_PASSWORD);
    await passwordFields.nth(1).fill(NEW_PASSWORD);
    await passwordFields.nth(2).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /set new password/i }).click();
    await page.waitForURL(url => !url.pathname.startsWith('/change-password'), { timeout: COLD_START_NAV_TIMEOUT_MS });
  }

  if (page.url().includes('/dashboard')) {
    const alreadyHasData = await page
      .getByRole('heading', { name: 'Priority Attention' })
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    if (alreadyHasData) return;
  }

  await page.goto('/');
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles('public/samples/sample-jira-export.csv');

  const proceedButton = page.getByRole('button', { name: /proceed to dashboard/i });
  if (await proceedButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await proceedButton.click();
  }

  await page.waitForURL(/\/dashboard/, { timeout: UPLOAD_NAV_TIMEOUT_MS });
}
