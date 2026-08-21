// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Delivery Intelligence — one representative Chromium run is enough because
// this spec validates the agent/evidence product flow rather than browser CSS.
import { test, expect } from '@playwright/test';
import { loginAndEnsureData, gotoResilient } from './helpers/auth';

test.describe('Delivery Intelligence workspace', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndEnsureData(page);
  });

  test('presents grounded evidence and runs a specialist when Ollama is unavailable', async ({ page }) => {
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

  test('renders a structured self-hosted AI answer distinctly from Evidence mode', async ({ page }) => {
    await gotoResilient(page, '/intelligence');

    await page.route('**/api/intelligence/ask', async route => {
      const request = route.request();
      expect(request.method()).toBe('POST');
      const body = request.postDataJSON() as { agent?: string; question?: string };
      expect(body.agent).toBe('executive');
      expect(body.question).toBeTruthy();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: {
            agent: 'executive',
            title: 'Leadership delivery brief',
            summary: 'Delivery confidence needs attention because two blockers remain active.',
            findings: [
              {
                title: 'Blocker pressure',
                detail: 'Two blocked items are visible in the current delivery snapshot.',
                severity: 'warning',
                evidence: '2 blocked items',
              },
            ],
            actions: [
              {
                title: 'Clear the highest-impact blocker',
                owner: 'Delivery Manager',
                rationale: 'Remove the strongest flow constraint before adding more WIP.',
                priority: 'now',
                href: '/flow-health',
              },
            ],
            mode: 'ai',
            model: 'qwen3.5:9b',
          },
        }),
      });
    });

    await page.getByRole('button', { name: 'What should leadership pay attention to today?' }).click();

    const answer = page.getByTestId('intelligence-answer');
    await expect(answer).toContainText('AI analysis');
    await expect(answer).toContainText('qwen3.5:9b');
    await expect(answer).toContainText('Blocker pressure');
    await expect(answer).toContainText('Clear the highest-impact blocker');
  });
});
