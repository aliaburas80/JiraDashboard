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
// not the original ADMIN_PASSWORD.
//
// The first fix attempt here tried ADMIN_PASSWORD and fell back to
// NEW_PASSWORD on a rejected attempt — technically correct, but it doubled
// the number of login POSTs for every test after the first, which combined
// with Playwright's own `retries: 1` was enough to exhaust the login route's
// rate limiter (5 attempts/60s — see app/api/auth/login/route.ts). All these
// requests share one bucket: there's no reverse proxy in front of this CI
// server, so every request's `x-forwarded-for` is absent and the limiter
// keys on the literal string 'unknown' for every single test. A 429 is
// rejected the same way a wrong password is (no navigation away from
// /login), which is what made that fix look like it hadn't worked.
//
// `workers: 1` + `fullyParallel: false` means every test in this file runs
// sequentially in one persistent Node process (true across Playwright's own
// retries too, not just normal sequential tests) — so a module-level
// variable reliably remembers the real current password across the whole
// run, and every test can log in correctly on the first attempt. Zero wasted
// attempts, no rate-limit exposure.
let currentPassword = ADMIN_PASSWORD;

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

  const loggedIn = await attemptLogin(page, currentPassword);
  if (!loggedIn) {
    // Defensive fallback only — should be unreachable in normal operation
    // now that currentPassword is tracked, but cheaper to keep than to
    // silently strand the page on /login if something unexpected happens.
    const fallback = currentPassword === ADMIN_PASSWORD ? NEW_PASSWORD : ADMIN_PASSWORD;
    await attemptLogin(page, fallback);
    currentPassword = fallback;
  }

  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: COLD_START_NAV_TIMEOUT_MS });
  // The URL above may still be mid-redirect-chain (e.g. a client-side push to
  // /dashboard that Next.js's own server redirect() then bounces on to
  // /dashboard/priority-attention) — waiting for the predicate alone races
  // the caller's next page.goto() against that still-in-flight navigation,
  // which Playwright surfaces as "Navigation ... is interrupted by another
  // navigation". Settling on network-idle here ensures the full chain has
  // landed before any code below reads page.url() or navigates again.
  await page.waitForLoadState('networkidle', { timeout: COLD_START_NAV_TIMEOUT_MS }).catch(() => {});

  if (page.url().includes('/change-password')) {
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill(currentPassword);
    await passwordFields.nth(1).fill(NEW_PASSWORD);
    await passwordFields.nth(2).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /set new password/i }).click();
    await page.waitForURL(url => !url.pathname.startsWith('/change-password'), { timeout: COLD_START_NAV_TIMEOUT_MS });
    currentPassword = NEW_PASSWORD;
  }

  if (page.url().includes('/dashboard')) {
    const alreadyHasData = await page
      .getByRole('heading', { name: 'Priority Attention' })
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    if (alreadyHasData) {
      // Same redirect-chain settling as above — the heading being visible
      // doesn't guarantee every in-flight request/redirect has finished.
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      return;
    }
  }

  await page.goto('/');
  const fileInput = page.locator('input[type="file"]').first();

  // A bad response here (bug 5: the seeded admin's emailVerified defaulted to
  // false, tripping EP-011's upload gate with a fast 403) previously produced
  // no signal at all — app/page.tsx's handleFile() sets an error and returns
  // without navigating anywhere, so the old code just sat in the final
  // waitForURL below for the full timeout with no indication why. Asserting
  // on the actual response turns that into an immediate, readable failure.
  const [uploadResponse] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/upload') && res.request().method() === 'POST', { timeout: UPLOAD_NAV_TIMEOUT_MS }),
    fileInput.setInputFiles('public/samples/sample-jira-export.csv'),
  ]);
  if (!uploadResponse.ok()) {
    const body = await uploadResponse.text().catch(() => '<unreadable response body>');
    throw new Error(`Upload failed with ${uploadResponse.status()}: ${body}`);
  }

  const proceedButton = page.getByRole('button', { name: /proceed to dashboard/i });
  if (await proceedButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await proceedButton.click();
  }

  await page.waitForURL(/\/dashboard/, { timeout: UPLOAD_NAV_TIMEOUT_MS });
  // Same redirect-chain settling as above — /dashboard itself immediately
  // server-redirects to /dashboard/priority-attention.
  await page.waitForLoadState('networkidle', { timeout: UPLOAD_NAV_TIMEOUT_MS }).catch(() => {});
}
