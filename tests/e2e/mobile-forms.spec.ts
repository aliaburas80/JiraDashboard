// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// MOBILE-07: the in-app retro form's Sprint Context and Action Items grids
// were hardcoded multi-column layouts with no phone-width handling, crushing
// a native date input into an unusable sliver at 375px. They should now
// stack to a single column below the `sm` (640px) breakpoint.
// Run against the `Mobile` Playwright project (iPhone 13, 390×664) via
// `npx playwright test mobile-forms.spec.ts --project=Mobile`.
import { test, expect } from '@playwright/test';
import { loginAndEnsureData, gotoResilient } from './helpers/auth';

test('retro form stacks Sprint Context and Action Items to a single column at mobile width', async ({ page }) => {
  await loginAndEnsureData(page);

  await gotoResilient(page, '/retro');
  await page.getByRole('button', { name: /fill in app/i }).click();

  const contextGrid = page.getByTestId('retro-context-grid');
  await expect(contextGrid).toBeVisible({ timeout: 10_000 });

  const contextFields = page.getByTestId('retro-context-field');
  const firstBox = await contextFields.nth(0).boundingBox();
  const secondBox = await contextFields.nth(1).boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  // Stacked (single column) means the second field starts below the first,
  // not beside it — their y-positions differ by roughly the first field's height.
  expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height / 2);

  const actionFields = page.getByTestId('retro-action-field');
  const actionFirst = await actionFields.nth(0).boundingBox();
  const actionSecond = await actionFields.nth(1).boundingBox();
  expect(actionFirst).not.toBeNull();
  expect(actionSecond).not.toBeNull();
  expect(actionSecond!.y).toBeGreaterThan(actionFirst!.y + actionFirst!.height / 2);
});
