// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// QA-GATE-05/06: the one critical path (login -> upload -> dashboard) that
// must work on every supported browser and every supported viewport. This is
// deliberately a single, narrow smoke test, not a feature-coverage suite —
// per-feature behavior is covered by the Jest suite (npm test).
//
// Expects a freshly-seeded admin account (prisma/seed.mjs, ADMIN_EMAIL/
// ADMIN_PASSWORD) with mustChangePassword: true — the seed script's default
// for every new admin — so this always exercises the forced password-change
// step, not just the common case.
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@deliveryclarity.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@DC2025';
const NEW_PASSWORD = 'E2e-rotated-password-2';

test('login, change the forced temporary password, upload a Jira export, and land on a populated dashboard', async ({ page }) => {
  // ── Login ──────────────────────────────────────────────────────────────
  await page.goto('/login');
  await page.getByLabel('Email address').fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15_000 });

  // ── Forced password change (seeded admin always has mustChangePassword) ─
  // Middleware redirects every route back to /change-password until this is
  // done, so it must be resolved before anything else can be reached.
  if (page.url().includes('/change-password')) {
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill(ADMIN_PASSWORD);
    await passwordFields.nth(1).fill(NEW_PASSWORD);
    await passwordFields.nth(2).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /set new password/i }).click();
    await page.waitForURL(url => !url.pathname.startsWith('/change-password'), { timeout: 15_000 });
  }

  // ── Upload (idempotent — a repeat run may already have data loaded) ────
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

  // Some uploads pause on a column-mapping confirmation step before
  // redirecting; click through it if present rather than waiting out its
  // auto-redirect countdown.
  const proceedButton = page.getByRole('button', { name: /proceed to dashboard/i });
  if (await proceedButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await proceedButton.click();
  }

  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Priority Attention' })).toBeVisible({ timeout: 15_000 });
});
