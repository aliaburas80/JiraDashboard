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
export async function loginAndEnsureData(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15_000 });

  if (page.url().includes('/change-password')) {
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill(ADMIN_PASSWORD);
    await passwordFields.nth(1).fill(NEW_PASSWORD);
    await passwordFields.nth(2).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /set new password/i }).click();
    await page.waitForURL(url => !url.pathname.startsWith('/change-password'), { timeout: 15_000 });
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

  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}
