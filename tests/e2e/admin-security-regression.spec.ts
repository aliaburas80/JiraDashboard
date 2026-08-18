// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-027: real PostgreSQL + separate Admin runtime security regression.
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { test, expect, type APIRequestContext } from '@playwright/test';
import { totpAt } from '../../admin-app/lib/totp';

const prisma = new PrismaClient();
const USER_APP_BASE_URL = (process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3100').replace(/\/$/, '');
const ADMIN_BASE_URL = (process.env.ADMIN_E2E_BASE_URL ?? 'http://127.0.0.1:3101').replace(/\/$/, '');
const PASSWORD = 'EP027-admin-password-2';
const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const TEST_IP = '10.27.0.27';
const ORG_A_MARKER = `ep027-org-a-${RUN_ID}`;
const ORG_B_MARKER = `ep027-org-b-${RUN_ID}`;

let orgAId = '';
let orgBId = '';
let adminAId = '';
let userAId = '';
let userBId = '';
let adminAEmail = '';

function userUrl(pathname: string): string {
  return `${USER_APP_BASE_URL}${pathname}`;
}

function adminUrl(pathname: string): string {
  return `${ADMIN_BASE_URL}${pathname}`;
}

function requestOptions(data?: unknown) {
  return {
    headers: { 'x-forwarded-for': TEST_IP },
    ...(data === undefined ? {} : { data }),
  };
}

async function adminPasswordLogin(request: APIRequestContext) {
  return request.post(
    adminUrl('/api/auth/login'),
    requestOptions({ email: adminAEmail, password: PASSWORD }),
  );
}

async function adminLogout(request: APIRequestContext) {
  const response = await request.post(adminUrl('/api/auth/logout'), requestOptions());
  expect(response.status()).toBe(200);
}

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [orgA, orgB] = await Promise.all([
    prisma.organization.create({
      data: {
        name: `EP-027 Org A ${RUN_ID}`,
        domain: `${ORG_A_MARKER}.example`,
        domainVerifiedAt: new Date(),
      },
    }),
    prisma.organization.create({
      data: {
        name: `EP-027 Org B ${RUN_ID}`,
        domain: `${ORG_B_MARKER}.example`,
        domainVerifiedAt: new Date(),
      },
    }),
  ]);
  orgAId = orgA.id;
  orgBId = orgB.id;

  adminAEmail = `ep027-admin-${RUN_ID}@example.com`;
  const [adminA, userA, userB] = await Promise.all([
    prisma.user.create({
      data: {
        organizationId: orgAId,
        name: 'EP-027 Admin A',
        email: adminAEmail,
        passwordHash,
        role: 'admin',
        isSuperAdmin: false,
        emailVerified: true,
        mustChangePassword: false,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        organizationId: orgAId,
        name: 'EP-027 User A',
        email: `ep027-user-a-${RUN_ID}@example.com`,
        passwordHash,
        role: 'user',
        emailVerified: true,
        mustChangePassword: false,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        organizationId: orgBId,
        name: 'EP-027 User B',
        email: `ep027-user-b-${RUN_ID}@example.com`,
        passwordHash,
        role: 'user',
        emailVerified: true,
        mustChangePassword: false,
        isActive: true,
      },
    }),
  ]);
  adminAId = adminA.id;
  userAId = userA.id;
  userBId = userB.id;

  await prisma.auditEvent.createMany({
    data: [
      {
        organizationId: orgAId,
        userId: adminAId,
        eventType: 'ep027_marker',
        eventDescription: ORG_A_MARKER,
      },
      {
        organizationId: orgBId,
        userId: userBId,
        eventType: 'ep027_marker',
        eventDescription: ORG_B_MARKER,
      },
    ],
  });
});

test.afterAll(async () => {
  if (adminAId) {
    await prisma.appSetting.deleteMany({ where: { ownerId: `admin:${adminAId}` } }).catch(() => undefined);
    await prisma.loginAttempt.deleteMany({
      where: {
        ip: {
          in: [
            TEST_IP,
            `admin-login:${TEST_IP}`,
            `admin-mfa:${adminAId}:${TEST_IP}`,
          ],
        },
      },
    }).catch(() => undefined);
  }

  const userIds = [adminAId, userAId, userBId].filter(Boolean);
  const organizationIds = [orgAId, orgBId].filter(Boolean);
  if (userIds.length || organizationIds.length) {
    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          ...(userIds.length ? [{ userId: { in: userIds } }] : []),
          ...(organizationIds.length ? [{ organizationId: { in: organizationIds } }] : []),
        ],
      },
    }).catch(() => undefined);
  }

  if (organizationIds.length) {
    await prisma.organization.deleteMany({ where: { id: { in: organizationIds } } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

test('EP-027 protects the separate Admin boundary, MFA, owner routes, and tenant data', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': TEST_IP });
  const request = page.context().request;

  // 1. The operational Admin API is private before any session exists.
  const unauthenticated = await request.get(adminUrl('/api/ops/users'), requestOptions());
  expect(unauthenticated.status()).toBe(401);

  // 2. A real user-app dc_session must not authenticate the separate Admin app.
  const userLogin = await request.post(
    userUrl('/api/auth/login'),
    requestOptions({ email: adminAEmail, password: PASSWORD }),
  );
  expect(userLogin.status()).toBe(200);
  let cookies = await page.context().cookies([USER_APP_BASE_URL, ADMIN_BASE_URL]);
  expect(cookies.some(cookie => cookie.name === 'dc_session')).toBe(true);
  expect(cookies.some(cookie => cookie.name === 'dc_admin_session')).toBe(false);

  const userCookieAgainstAdmin = await request.get(adminUrl('/api/ops/users'), requestOptions());
  expect(userCookieAgainstAdmin.status()).toBe(401);

  // 3. Migrated user-app Admin APIs are retired and cannot bypass Admin MFA.
  const retiredLegacyAdmin = await request.get(userUrl('/api/admin/users'), requestOptions());
  expect(retiredLegacyAdmin.status()).toBe(410);

  await page.context().clearCookies();

  // 4. Exercise the real Admin login UI, then prove password-only is still insufficient.
  await page.goto(adminUrl('/login'));
  await page.getByLabel('Administrator email').fill(adminAEmail);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  const [adminLoginResponse] = await Promise.all([
    page.waitForResponse(
      response => response.url() === adminUrl('/api/auth/login') && response.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Continue' }).click(),
  ]);
  expect(adminLoginResponse.status()).toBe(200);
  await page.waitForURL(
    url => url.origin === new URL(ADMIN_BASE_URL).origin && url.pathname === '/mfa/enroll',
    { timeout: 20_000 },
  );

  const passwordOnly = await request.get(adminUrl('/api/ops/users'), requestOptions());
  expect(passwordOnly.status()).toBe(401);

  // 5. First-time TOTP enrollment creates the fully authenticated Admin session.
  const enrollmentStart = await request.post(adminUrl('/api/mfa/enroll/start'), requestOptions());
  expect(enrollmentStart.status()).toBe(200);
  const enrollment = await enrollmentStart.json() as { secret?: string };
  expect(enrollment.secret).toMatch(/^[A-Z2-7]+$/);
  const enrollmentCode = totpAt(enrollment.secret!).code;

  const enrollmentConfirm = await request.post(
    adminUrl('/api/mfa/enroll/confirm'),
    requestOptions({ code: enrollmentCode }),
  );
  expect(enrollmentConfirm.status()).toBe(200);
  const enrollmentResult = await enrollmentConfirm.json() as { recoveryCodes?: string[] };
  expect(enrollmentResult.recoveryCodes).toHaveLength(8);
  const recoveryCode = enrollmentResult.recoveryCodes![0];

  cookies = await page.context().cookies(ADMIN_BASE_URL);
  const adminCookie = cookies.find(cookie => cookie.name === 'dc_admin_session');
  expect(adminCookie).toBeDefined();
  expect(adminCookie?.httpOnly).toBe(true);
  expect(adminCookie?.sameSite).toBe('Strict');
  expect(cookies.some(cookie => cookie.name === 'dc_session')).toBe(false);

  // 6. Organization-scoped reads include Org A and never expose Org B.
  const usersResponse = await request.get(adminUrl('/api/ops/users'), requestOptions());
  expect(usersResponse.status()).toBe(200);
  const usersBody = await usersResponse.json() as { users?: Array<{ id: string; email: string }> };
  const returnedUserIds = (usersBody.users ?? []).map(user => user.id);
  expect(returnedUserIds).toContain(adminAId);
  expect(returnedUserIds).toContain(userAId);
  expect(returnedUserIds).not.toContain(userBId);

  const auditResponse = await request.get(adminUrl('/api/ops/audit?take=100'), requestOptions());
  expect(auditResponse.status()).toBe(200);
  const auditBody = await auditResponse.json() as { events?: Array<{ eventDescription: string }> };
  const auditDescriptions = (auditBody.events ?? []).map(event => event.eventDescription);
  expect(auditDescriptions).toContain(ORG_A_MARKER);
  expect(auditDescriptions).not.toContain(ORG_B_MARKER);

  // 7. Cross-organization mutation attempts are indistinguishable from missing records.
  const crossOrgPatch = await request.patch(
    adminUrl('/api/ops/users'),
    requestOptions({ id: userBId, name: 'SHOULD-NOT-CHANGE' }),
  );
  expect(crossOrgPatch.status()).toBe(404);

  const crossOrgDelete = await request.delete(
    adminUrl('/api/ops/users'),
    requestOptions({ id: userBId }),
  );
  expect(crossOrgDelete.status()).toBe(404);
  const untouchedOrgBUser = await prisma.user.findUnique({ where: { id: userBId } });
  expect(untouchedOrgBUser?.name).toBe('EP-027 User B');

  // 8. Ordinary Admin cannot access deployment-wide Owner Admin operations.
  const ownerOnly = await request.get(adminUrl('/api/ops/diagnostics'), requestOptions());
  expect(ownerOnly.status()).toBe(403);

  // 9. The reverse cookie boundary also holds: dc_admin_session is not a user-app session.
  const adminCookieAgainstUserApp = await request.get(userUrl('/api/imports'), requestOptions());
  expect(adminCookieAgainstUserApp.status()).toBe(401);

  // 10. Replaying the TOTP step used for enrollment is rejected.
  await adminLogout(request);
  const secondPasswordLogin = await adminPasswordLogin(request);
  expect(secondPasswordLogin.status()).toBe(200);
  const secondLoginBody = await secondPasswordLogin.json() as { enrollmentRequired?: boolean };
  expect(secondLoginBody.enrollmentRequired).toBe(false);

  const replayedTotp = await request.post(
    adminUrl('/api/mfa/verify'),
    requestOptions({ code: enrollmentCode }),
  );
  expect(replayedTotp.status()).toBe(401);

  // 11. A recovery code works once, is removed server-side, and cannot be replayed.
  const recoveryLogin = await request.post(
    adminUrl('/api/mfa/verify'),
    requestOptions({ code: recoveryCode }),
  );
  expect(recoveryLogin.status()).toBe(200);
  const recoveryBody = await recoveryLogin.json() as { method?: string; recoveryCodesRemaining?: number };
  expect(recoveryBody.method).toBe('recovery');
  expect(recoveryBody.recoveryCodesRemaining).toBe(7);

  await adminLogout(request);
  const thirdPasswordLogin = await adminPasswordLogin(request);
  expect(thirdPasswordLogin.status()).toBe(200);
  const replayedRecovery = await request.post(
    adminUrl('/api/mfa/verify'),
    requestOptions({ code: recoveryCode }),
  );
  expect(replayedRecovery.status()).toBe(401);

  const evidence = {
    unauthenticatedAdminApi: unauthenticated.status(),
    userCookieAgainstAdmin: userCookieAgainstAdmin.status(),
    legacyAdminCutover: retiredLegacyAdmin.status(),
    passwordOnlyAdminApi: passwordOnly.status(),
    orgAUsersVisible: returnedUserIds.includes(adminAId) && returnedUserIds.includes(userAId),
    orgBUserHidden: !returnedUserIds.includes(userBId),
    crossOrgPatch: crossOrgPatch.status(),
    crossOrgDelete: crossOrgDelete.status(),
    ownerOnlyDenied: ownerOnly.status(),
    adminCookieAgainstUserApp: adminCookieAgainstUserApp.status(),
    totpReplay: replayedTotp.status(),
    recoveryMethod: recoveryBody.method,
    recoveryCodesRemaining: recoveryBody.recoveryCodesRemaining,
    recoveryReplay: replayedRecovery.status(),
  };
  console.log(`[EP-027] ${JSON.stringify(evidence)}`);
  await testInfo.attach('ep-027-security-regression.json', {
    body: Buffer.from(JSON.stringify(evidence, null, 2)),
    contentType: 'application/json',
  });
});
