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
import { loginAndEnsureData } from './helpers/auth';

test('login, change the forced temporary password, upload a Jira export, and land on a populated dashboard', async ({ page }) => {
  await loginAndEnsureData(page);

  await expect(page.getByRole('heading', { name: 'Priority Attention' })).toBeVisible({ timeout: 15_000 });
});
