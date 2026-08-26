// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Regression coverage for the admin/super-admin topbar collision reported at
// narrow desktop widths. This runs on Desktop Chrome only; the test explicitly
// resizes to the affected viewport before loading dashboard data.
import { test, expect } from '@playwright/test';
import { loginAndEnsureData } from './helpers/auth';

test('dashboard topbar stays inside the viewport at 1365px', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 900 });
  await loginAndEnsureData(page);

  const header = page.locator('header').first();
  await expect(header).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Upload' })).toBeVisible();

  const headerFits = await header.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
  expect(headerFits).toBe(true);

  // At this width Sync Jira is intentionally moved out of the crowded topbar;
  // it remains available through the Jira destination instead of competing with
  // primary navigation for horizontal space.
  await expect(page.getByRole('button', { name: 'Sync new data from Jira' })).toBeHidden();
});
