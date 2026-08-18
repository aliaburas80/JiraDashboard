// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// TEST-REQ-14: the add-member request UI (RequestAddMemberModal) had never
// been checked at phone width — genuinely untested per TODO-List.md, and not
// coverable by Jest/jsdom since the behavior under test is real CSS layout.
// EP-024 moved the operational Admin queue out of the user app, so this suite
// also verifies the old embedded Admin route fails closed instead of rendering
// the retired queue behind the user-app session.
// Run against the `Mobile` Playwright project (iPhone 13, 390×844) via
// `npx playwright test mobile-requests.spec.ts --project=Mobile`.
import { test, expect, devices, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../src/lib/auth';
import { loginAndEnsureData, gotoResilient, isolateE2eLoginRateLimit } from './helpers/auth';

const prisma = new PrismaClient();

// Playwright's `page.request` API client doesn't reliably forward this app's
// `Secure`-flagged session cookie against a plain-HTTP 127.0.0.1 origin (the
// browser itself treats localhost as a secure context and sends it fine on
// real navigations/fetches, but `page.request` is a separate out-of-process
// HTTP client that applies stricter RFC 6265 Secure-cookie rules with no such
// exemption). Routing authenticated setup calls through the page's own
// `fetch()` — genuinely executed inside the logged-in browser tab — sidesteps
// that entirely.
async function authedFetch<T>(
  page: Page,
  url: string,
  init: { method: string; body?: unknown },
): Promise<{ ok: boolean; status: number; body: T }> {
  return page.evaluate(async ({ url, init }) => {
    const res = await fetch(url, {
      method:  init.method,
      headers: { 'Content-Type': 'application/json' },
      body:    init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  }, { url, init });
}

// RequestAddMemberModal.tsx's trigger button only renders for a logged-in
// user who is BOTH the protected super-admin account (app/members/page.tsx
// redirects everyone else away from /members entirely) AND holds a
// non-'admin' role. There is deliberately no user-app API surface to grant
// isSuperAdmin after EP-024, so the E2E fixture is created directly in the
// ephemeral Postgres database, exactly as the seed/bootstrap path does.
const THROWAWAY_EMAIL         = 'e2e-mobile-requests-member@example.com';
const THROWAWAY_TEMP_PASSWORD = 'E2e-mobile-req-temp1';
const THROWAWAY_NEW_PASSWORD  = 'E2e-mobile-req-new1';

test.describe('add-member request UI stays usable at mobile width', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndEnsureData(page);
  });

  test('embedded Admin route fails closed after EP-024 cutover', async ({ page }) => {
    // The E2E user-app process intentionally has no ADMIN_APP_URL configured.
    // EP-024 must therefore fail closed to the normal login surface instead of
    // rendering the retired embedded Admin console behind a dc_session.
    await gotoResilient(page, '/admin/settings');
    await page.waitForURL(url => (
      url.pathname === '/login' && url.searchParams.get('adminUnavailable') === '1'
    ), { timeout: 30_000 });

    const currentUrl = new URL(page.url());
    expect(currentUrl.pathname).toBe('/login');
    expect(currentUrl.searchParams.get('adminUnavailable')).toBe('1');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('request-add-member modal fits the viewport and stacks its fields', async ({ page, browser }) => {
    let memberUserId: string | undefined;

    // Idempotent fixture setup: a cancelled/retried local run may have left a
    // prior row behind. Delete by the stable fixture email first; all owned
    // User relations are cascade-safe in the test schema.
    await prisma.user.deleteMany({ where: { email: THROWAWAY_EMAIL } });

    try {
      const passwordHash = await hashPassword(THROWAWAY_TEMP_PASSWORD);
      const fixture = await prisma.user.create({
        data: {
          name: 'Mobile Request Fixture',
          email: THROWAWAY_EMAIL,
          passwordHash,
          role: 'scrum_master',
          isSuperAdmin: true,
          mustChangePassword: true,
        },
        select: { id: true },
      });
      memberUserId = fixture.id;

      const memberContext = await browser.newContext({ ...devices['iPhone 13'] });
      const memberPage = await memberContext.newPage();

      try {
        // This account signs in inside a second browser context during the
        // same test. Give it its own E2E-only forwarded IP too so it cannot be
        // throttled by the admin setup logins that ran earlier in the suite.
        await isolateE2eLoginRateLimit(memberPage);
        await memberPage.goto('/login');
        await memberPage.getByLabel('Email address').fill(THROWAWAY_EMAIL);
        await memberPage.getByLabel('Password', { exact: true }).fill(THROWAWAY_TEMP_PASSWORD);
        await memberPage.getByRole('button', { name: /sign in/i }).click();
        await memberPage.waitForURL(/\/change-password/, { timeout: 30_000 });

        const pwFields = memberPage.locator('input[type="password"]');
        await pwFields.nth(0).fill(THROWAWAY_TEMP_PASSWORD);
        await pwFields.nth(1).fill(THROWAWAY_NEW_PASSWORD);
        await pwFields.nth(2).fill(THROWAWAY_NEW_PASSWORD);
        await memberPage.getByRole('button', { name: /set new password/i }).click();
        await memberPage.waitForURL(url => !url.pathname.startsWith('/change-password'), { timeout: 30_000 });

        await gotoResilient(memberPage, '/members');
        const trigger = memberPage.getByRole('button', { name: /request add member/i });
        await expect(trigger).toBeVisible({ timeout: 10_000 });
        await trigger.click();

        const dialog = memberPage.getByRole('dialog', { name: /request add member/i });
        await expect(dialog).toBeVisible();

        const viewport = memberPage.viewportSize();
        const dialogBox = await dialog.boundingBox();
        expect(viewport).not.toBeNull();
        expect(dialogBox).not.toBeNull();
        expect(dialogBox!.width).toBeLessThanOrEqual(viewport!.width);

        const hasHorizontalOverflow = await memberPage.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(hasHorizontalOverflow).toBe(false);

        // Full-width fields (`w-full`) stacked one per row — the name and
        // email inputs must not sit side by side at this width.
        const nameBox  = await memberPage.getByPlaceholder('Jane Smith').boundingBox();
        const emailBox = await memberPage.getByPlaceholder('jane@company.com').boundingBox();
        expect(nameBox).not.toBeNull();
        expect(emailBox).not.toBeNull();
        expect(emailBox!.y).toBeGreaterThan(nameBox!.y + nameBox!.height / 2);
      } finally {
        await memberContext.close();
      }
    } finally {
      // Direct DB cleanup is intentional: EP-024 retires the legacy
      // /api/admin/users mutation surface in the user app with HTTP 410.
      await prisma.user.deleteMany({ where: { email: THROWAWAY_EMAIL } });
      await prisma.$disconnect();
    }
  });
});