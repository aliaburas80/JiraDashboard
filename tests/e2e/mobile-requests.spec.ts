// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// TEST-REQ-14: the add-member request UI (RequestAddMemberModal +
// UserAddRequestsPanel) had never been checked at phone width — genuinely
// untested per TODO-List.md, and not coverable by Jest/jsdom since the
// behavior under test is real CSS layout (grid stacking, no horizontal
// overflow), not component logic.
// Run against the `Mobile` Playwright project (iPhone 13, 390×844) via
// `npx playwright test mobile-requests.spec.ts --project=Mobile`.
import { test, expect, devices, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
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
// non-'admin' role. There is deliberately no API surface to grant
// isSuperAdmin (EP-016, app/api/admin/users/route.ts) — it's set directly
// against the DB, same as prisma/seed.mjs does for the bootstrap admin. This
// test does the same, scoped to one throwaway fixture user it creates and
// deletes itself.
const THROWAWAY_EMAIL         = 'e2e-mobile-requests-member@example.com';
const THROWAWAY_TEMP_PASSWORD = 'E2e-mobile-req-temp1';
const THROWAWAY_NEW_PASSWORD  = 'E2e-mobile-req-new1';

test.describe('add-member request UI stays usable at mobile width', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndEnsureData(page);
  });

  test('admin request queue stacks its detail grid to a single column', async ({ page }) => {
    const fixtureEmail = 'mobile-layout-check@example.com';
    // The backend rejects a second pending request for the same email
    // (app/api/user-add-requests/route.ts) — clear any leftover from a prior
    // run against a persistent (non-ephemeral) database before creating one.
    await prisma.userAddRequest.deleteMany({ where: { requestedEmail: fixtureEmail } });

    try {
      // Ensure at least one pending request exists to expand — the backend
      // only requires an authenticated session, not a non-admin role (the UI
      // hides the button from admins, but the route doesn't gate on role),
      // so the already-logged-in admin can submit one directly.
      const submitRes = await authedFetch(page, '/api/user-add-requests', {
        method: 'POST',
        body: {
          requestedName:  'Mobile Layout Check',
          requestedEmail: fixtureEmail,
          requestedRole:  'manager',
          reason:         'E2E TEST-REQ-14 fixture — verifying the admin request queue stacks correctly at phone width.',
          teamOrProject:  'QA',
        },
      });
      expect(submitRes.ok).toBe(true);

      await gotoResilient(page, '/admin/settings');

      // MOBILE-TOPBAR-01: phone width keeps the fixed header compact. The
      // admin shell deliberately does not provide the optional sidebar-toggle
      // prop, so this test verifies the real overflow contract rather than
      // assuming a hamburger exists on every shell.
      await expect(page.getByRole('button', { name: 'Search pages and features' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'New Upload' })).toBeHidden();
      await expect(page.getByRole('button', { name: 'Sync new data from Jira' })).toBeHidden();
      const documentHasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(documentHasHorizontalOverflow).toBe(false);

      // Scoped by the fixture's own text rather than `.first()` — this
      // settings page also renders an unrelated "how requests work"
      // explainer panel using the same `rounded-[14px]` card styling above
      // the actual queue.
      const firstCard = page
        .locator('div.rounded-\\[14px\\].border.border-slate-200.bg-white')
        .filter({ hasText: 'Mobile Layout Check' });
      await expect(firstCard).toBeVisible({ timeout: 10_000 });
      await firstCard.click();

      // The expanded detail grid is `grid grid-cols-1 sm:grid-cols-2` — below
      // the 640px `sm` breakpoint it must render as one column, so two detail
      // blocks (there are always at least "Requested by" + "Role of
      // requester") must stack vertically rather than sit side by side.
      const detailBlocks = firstCard.locator('div.rounded-\\[10px\\].border.border-slate-200.bg-slate-50');
      await expect(detailBlocks.first()).toBeVisible({ timeout: 10_000 });
      const firstBox  = await detailBlocks.nth(0).boundingBox();
      const secondBox = await detailBlocks.nth(1).boundingBox();
      expect(firstBox).not.toBeNull();
      expect(secondBox).not.toBeNull();
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height / 2);

      // The filter bar (`pending`/`all`/`decided`) must not force the settings
      // content wider than the viewport — it is `flex flex-wrap`, so it should
      // wrap independently of the now-compact topbar.
      const hasHorizontalOverflow = await page.evaluate(() => {
        const main = document.getElementById('main-content');
        return !!main && main.scrollWidth > main.clientWidth;
      });
      expect(hasHorizontalOverflow).toBe(false);
    } finally {
      await prisma.userAddRequest.deleteMany({ where: { requestedEmail: fixtureEmail } });
    }
  });

  test('request-add-member modal fits the viewport and stacks its fields', async ({ page, browser }) => {
    let memberUserId: string | undefined;

    // Defensive — a prior run against this same (non-ephemeral, local-dev)
    // database that failed before reaching the `finally` cleanup below would
    // otherwise leave this email permanently taken.
    const leftover = await prisma.user.findUnique({ where: { email: THROWAWAY_EMAIL } });
    if (leftover) await prisma.user.delete({ where: { id: leftover.id } });

    try {
      const createRes = await authedFetch<{ user: { id: string } }>(page, '/api/admin/users', {
        method: 'POST',
        body: {
          name:     'Mobile Request Fixture',
          email:    THROWAWAY_EMAIL,
          password: THROWAWAY_TEMP_PASSWORD,
          role:     'scrum_master',
        },
      });
      expect(createRes.ok).toBe(true);
      memberUserId = createRes.body.user.id;

      // Grant the one flag no API can set, so /members lets this account in
      // (see comment above the fixture constants).
      await prisma.user.update({ where: { id: memberUserId }, data: { isSuperAdmin: true } });

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
      if (memberUserId) {
        await authedFetch(page, '/api/admin/users', { method: 'DELETE', body: { id: memberUserId } });
      }
      await prisma.$disconnect();
    }
  });
});
