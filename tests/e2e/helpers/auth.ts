// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Shared login/upload flow for E2E specs — extracted from critical-path.spec.ts
// so mobile-viewport specs (MOBILE-09) don't duplicate it. Expects a
// freshly-seeded admin account (prisma/seed.mjs) with mustChangePassword: true.
import { randomBytes } from 'node:crypto';
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
// requests used to share one bucket because there is no reverse proxy in
// front of the CI server, so every request's `x-forwarded-for` was absent and
// the limiter keyed on the literal string 'unknown'.
//
// `workers: 1` + `fullyParallel: false` means normal tests are sequential,
// but Playwright may restart a worker after a failure. A restarted worker
// resets this module-level password variable to ADMIN_PASSWORD while the DB
// still contains NEW_PASSWORD. That defensive fallback is therefore still
// necessary. Each E2E page now gets a unique private test IP before login so
// a legitimate fallback/retry can never consume another test's rate-limit
// budget. Production rate-limit behavior is unchanged.
let currentPassword = ADMIN_PASSWORD;

export async function isolateE2eLoginRateLimit(page: Page): Promise<void> {
  const octets = randomBytes(3);
  const ip = `10.${octets[0]}.${octets[1]}.${octets[2]}`;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': ip });
}

async function attemptLogin(page: Page, password: string): Promise<{ ok: boolean; status: number }> {
  await page.getByLabel('Password', { exact: true }).fill(password);
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.request().method() === 'POST'),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
  return { ok: response.ok(), status: response.status() };
}

// Right after login/password-change/upload, the app can still be working
// through client router.push()/router.refresh() plus server redirects. If a
// goto is issued while that chain is resolving, the browser may cancel it in
// favor of the app's own in-flight navigation. Chromium, WebKit, and Firefox
// report that cancellation differently. A single retry was not sufficient in
// CI when two redirects landed back-to-back, so retry a small bounded number
// of times, yielding briefly between attempts. Unexpected navigation errors
// still fail immediately.
export async function gotoResilient(page: Page, url: string): Promise<void> {
  const navigationCancellation = /interrupted by another navigation|Frame load interrupted|NS_BINDING_ABORTED/;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await page.goto(url);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!navigationCancellation.test(message) || attempt === 3) throw err;
      await page.waitForTimeout(200);
    }
  }
}

export async function loginAndEnsureData(page: Page): Promise<void> {
  await isolateE2eLoginRateLimit(page);
  await page.goto('/login');
  await page.getByLabel('Email address').fill(ADMIN_EMAIL);

  const firstAttempt = await attemptLogin(page, currentPassword);
  if (!firstAttempt.ok) {
    // Defensive fallback for a restarted Playwright worker after the seeded
    // account's forced password change has already persisted to PostgreSQL.
    const fallback = currentPassword === ADMIN_PASSWORD ? NEW_PASSWORD : ADMIN_PASSWORD;
    const fallbackAttempt = await attemptLogin(page, fallback);
    if (!fallbackAttempt.ok) {
      throw new Error(
        `E2E login failed with statuses ${firstAttempt.status} and ${fallbackAttempt.status}; ` +
        'the browser never received an authenticated session.',
      );
    }
    currentPassword = fallback;
  }

  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: COLD_START_NAV_TIMEOUT_MS });

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
    if (alreadyHasData) return;
  }

  await gotoResilient(page, '/');
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
}
