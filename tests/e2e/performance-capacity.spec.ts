// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-026: representative 7,000-row capacity + browser performance regression.
//
// This is deliberately NOT a production SLA. GitHub-hosted runners are noisy
// and materially different from the production host. The generous ceilings
// below are regression tripwires: they catch a severe performance cliff while
// measured staging/production Web Vitals remain a separate pre-launch gate.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { test, expect } from '@playwright/test';
import { isolateE2eLoginRateLimit, gotoResilient } from './helpers/auth';

const prisma = new PrismaClient();
const ROWS = 7_000;
const PASSWORD = 'Perf-capacity-password-2';
const email = `e2e-perf-capacity-${Date.now()}@example.com`;
const filename = `e2e-capacity-${ROWS}.csv`;
let userId = '';
let tempDir = '';
let csvPath = '';

type TimingKey = 'dashboardPaintMs' | 'filterRenderMs' | 'excelBuildMs';

const REGRESSION_BUDGET_MS = {
  uploadHttp: 30_000,
  serverProcessing: 15_000,
  dashboardPaint: 3_000,
  filterRender: 1_000,
  excelBuild: 15_000,
} as const;

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      name: 'E2E Performance Admin',
      email,
      passwordHash,
      role: 'admin',
      emailVerified: true,
      mustChangePassword: false,
      isActive: true,
    },
  });
  userId = user.id;

  tempDir = mkdtempSync(join(tmpdir(), 'delivery-clarity-ep026-'));
  csvPath = join(tempDir, filename);
  execFileSync(
    process.execPath,
    [
      'scripts/generate-synthetic-jira-export.js',
      `--rows=${ROWS}`,
      `--out=${csvPath}`,
      '--seed=26',
    ],
    { cwd: process.cwd(), stdio: 'pipe' },
  );
});

test.afterAll(async () => {
  if (userId) {
    await prisma.loginAttempt.deleteMany({ where: { ip: `ul:${userId}` } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  }
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  await prisma.$disconnect();
});

test('7,000 Jira issues upload, render, filter, and export within CI regression ceilings', async ({ page }, testInfo) => {
  test.setTimeout(180_000);

  const timings: Record<TimingKey, number | null> = {
    dashboardPaintMs: null,
    filterRenderMs: null,
    excelBuildMs: null,
  };

  page.on('console', message => {
    const text = message.text();
    const dashboard = text.match(/^\[dashboard\] metrics-loaded→paint: (\d+)ms/);
    if (dashboard) timings.dashboardPaintMs = Number(dashboard[1]);

    const filter = text.match(/^\[priority-attention\] filter→re-render: (\d+)ms/);
    if (filter) timings.filterRenderMs = Number(filter[1]);

    const excel = text.match(/^\[export\] buildInsightWorkbook: (\d+)ms for (\d+) issues/);
    if (excel && Number(excel[2]) === ROWS) timings.excelBuildMs = Number(excel[1]);
  });

  // Dedicated admin fixture keeps the heavy benchmark isolated from the
  // shared seeded E2E account and bypasses trial-entitlement consumption.
  await isolateE2eLoginRateLimit(page);
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  const [loginResponse] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/auth/login') && res.request().method() === 'POST'),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);
  expect(loginResponse.ok()).toBe(true);
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30_000 });

  await gotoResilient(page, '/');
  const fileInput = page.locator('input[type="file"]').first();
  const uploadStartedAt = Date.now();
  const [uploadResponse] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes('/api/upload') && res.request().method() === 'POST',
      { timeout: REGRESSION_BUDGET_MS.uploadHttp + 10_000 },
    ),
    fileInput.setInputFiles(csvPath),
  ]);
  const uploadHttpMs = Date.now() - uploadStartedAt;

  const body = await uploadResponse.json() as {
    metrics?: {
      totalIssues?: number;
      flow?: { items?: unknown[]; itemsCapped?: boolean; totalItemCount?: number };
    };
    warnings?: string[];
    error?: string;
  };
  expect(uploadResponse.ok(), body.error ?? '7,000-row upload failed').toBe(true);
  expect(uploadHttpMs).toBeLessThan(REGRESSION_BUDGET_MS.uploadHttp);

  // Capacity contract: aggregate metrics cover all 7,000 issues while the
  // browser payload stays bounded to the 5,000 highest-risk flow items.
  expect(body.metrics?.totalIssues).toBe(ROWS);
  expect(body.metrics?.flow?.itemsCapped).toBe(true);
  expect(body.metrics?.flow?.totalItemCount).toBe(ROWS);
  expect(body.metrics?.flow?.items).toHaveLength(5_000);
  expect(body.warnings?.some(warning => warning.includes('top 5,000 highest-risk items'))).toBe(true);

  const importLog = await prisma.importLog.findFirst({
    where: { userId, fileName: filename },
    orderBy: { uploadedAt: 'desc' },
  });
  expect(importLog).not.toBeNull();
  expect(importLog?.rowCount).toBe(ROWS);
  expect(importLog?.totalIssues).toBe(ROWS);
  expect(importLog?.processingTimeMs ?? Number.POSITIVE_INFINITY)
    .toBeLessThan(REGRESSION_BUDGET_MS.serverProcessing);

  const metadata = JSON.parse(importLog?.metadataJson ?? '{}') as Record<string, unknown>;
  for (const key of ['parseTimeMs', 'mergeValidateTimeMs', 'metricsCalcTimeMs']) {
    expect(typeof metadata[key], `${key} must remain instrumented`).toBe('number');
    expect(Number(metadata[key])).toBeGreaterThanOrEqual(0);
  }

  const proceedButton = page.getByRole('button', { name: /proceed to dashboard/i });
  if (await proceedButton.isVisible({ timeout: 5_000 }).catch(() => false)) await proceedButton.click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Priority Attention' })).toBeVisible({ timeout: 20_000 });

  await expect.poll(() => timings.dashboardPaintMs, { timeout: 10_000 }).not.toBeNull();
  expect(timings.dashboardPaintMs!).toBeLessThan(REGRESSION_BUDGET_MS.dashboardPaint);

  await page.getByRole('button', { name: /^Blocked \(/ }).click();
  await expect.poll(() => timings.filterRenderMs, { timeout: 10_000 }).not.toBeNull();
  expect(timings.filterRenderMs!).toBeLessThan(REGRESSION_BUDGET_MS.filterRender);

  await gotoResilient(page, '/reports');
  const excelButton = page.getByRole('button', { name: 'Download Excel' });
  await expect(excelButton).toBeEnabled({ timeout: 20_000 });
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await excelButton.click();
  await downloadPromise;
  await expect.poll(() => timings.excelBuildMs, { timeout: 10_000 }).not.toBeNull();
  expect(timings.excelBuildMs!).toBeLessThan(REGRESSION_BUDGET_MS.excelBuild);

  const result = {
    rows: ROWS,
    uploadHttpMs,
    processingTimeMs: importLog?.processingTimeMs ?? null,
    parseTimeMs: metadata.parseTimeMs ?? null,
    mergeValidateTimeMs: metadata.mergeValidateTimeMs ?? null,
    metricsCalcTimeMs: metadata.metricsCalcTimeMs ?? null,
    ...timings,
    budgetsMs: REGRESSION_BUDGET_MS,
    environment: 'GitHub Actions / Chromium — regression signal, not production SLA',
  };

  console.log(`[EP-026] ${JSON.stringify(result)}`);
  await testInfo.attach('ep-026-performance-capacity.json', {
    body: Buffer.from(JSON.stringify(result, null, 2)),
    contentType: 'application/json',
  });
});
