// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// MOBILE-05/09: dense chart/table routes must not hard-overflow at phone
// width — they should scroll horizontally with a pinned first column instead.
// Run against the `Mobile` Playwright project (iPhone 13, 390×664) via
// `npx playwright test mobile-dense-tables.spec.ts --project=Mobile`.
import { test, expect } from '@playwright/test';
import { loginAndEnsureData } from './helpers/auth';

test.describe('dense tables scroll horizontally with a pinned first column at mobile width', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndEnsureData(page);
  });

  test('roadmap Gantt and forecast table', async ({ page }) => {
    await page.goto('/roadmap');

    const ganttScroll = page.getByTestId('gantt-scroll');
    await expect(ganttScroll).toBeVisible();
    const ganttOverflow = await ganttScroll.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(ganttOverflow).toBe(true);
    await expect(page.getByTestId('gantt-label').first()).toHaveCSS('position', 'sticky');

    const forecastScroll = page.getByTestId('forecast-scroll');
    await expect(forecastScroll).toBeVisible();
    const forecastOverflow = await forecastScroll.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(forecastOverflow).toBe(true);
    await expect(page.getByTestId('forecast-epic-cell').first()).toHaveCSS('position', 'sticky');
  });

  test('work explorer issue table', async ({ page }) => {
    await page.goto('/work-explorer');

    const tableScroll = page.getByTestId('explorer-table-scroll');
    await expect(tableScroll).toBeVisible();
    const overflow = await tableScroll.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(true);
    await expect(page.getByTestId('explorer-key-cell').first()).toHaveCSS('position', 'sticky');
  });
});
