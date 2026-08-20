// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Delivery Intelligence — one representative Chromium run is enough because
// this spec validates the agent/evidence product flow rather than browser CSS.
import { test, expect } from '@playwright/test';
import { loginAndEnsureData, gotoResilient } from './helpers/auth';

test.describe('Delivery Intelligence workspace', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndEnsureData(page);
  });

  test('presents grounded evidence and runs a specialist without an AI key', async ({ page }) => {
    await gotoResilient(page, '/intelligence');

    await expect(page.getByRole('heading', { name: 'Delivery Intelligence' })).toBeVisible();
    await expect(page.getByText('What the data is saying')).toBeVisible();
    await expect(page.getByRole('button', { name: /Executive/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Flow/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Risk/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Forecast/ })).toBeVisible();

    await page.getByRole('button', { name: /Flow/ }).click();
    await page.getByRole('button', { name: 'Where is work getting stuck?' }).click();

    const answer = page.getByTestId('intelligence-answer');
    await expect(answer).toBeVisible();
    await expect(answer).toContainText('Evidence mode');
    await expect(answer).toContainText(/flow|block|cycle/i);
    await expect(answer).toContainText('Recommended actions');
  });
});
