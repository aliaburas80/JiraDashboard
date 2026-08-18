// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// TEST-REQ-12: real Postgres-backed regression coverage for the add-member
// concurrent double-accept race. Two PATCH requests are launched together
// against the same pending request; exactly one may create the unique user and
// the loser must fail cleanly with 409 rather than double-accepting or leaking
// a Prisma unique-constraint error as a 500.
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { loginAndEnsureData } from './helpers/auth';

const prisma = new PrismaClient();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@deliveryclarity.com';

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('TEST-REQ-12: concurrent double accept creates one user and returns one conflict', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Desktop Chrome', 'Database race coverage only needs one browser project.');

  await loginAndEnsureData(page);

  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL }, select: { id: true } });
  expect(admin).not.toBeNull();

  const fixtureEmail = `e2e-double-accept-${Date.now()}@example.com`;
  let requestId: string | undefined;

  try {
    const request = await prisma.userAddRequest.create({
      data: {
        requestedName: 'Concurrent Accept Fixture',
        requestedEmail: fixtureEmail,
        requestedRole: 'manager',
        reason: 'TEST-REQ-12 concurrent double-accept regression fixture.',
        requestedByUserId: admin!.id,
        status: 'pending',
      },
      select: { id: true },
    });
    requestId = request.id;

    const responses = await page.evaluate(async ({ id }) => {
      const accept = async () => {
        const response = await fetch(`/api/admin/user-add-requests/${id}/accept`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tempPassword: 'RacePass12' }),
        });
        return {
          status: response.status,
          body: await response.json().catch(() => ({})),
        };
      };

      return Promise.all([accept(), accept()]);
    }, { id: request.id });

    expect(responses.map(result => result.status).sort((a, b) => a - b)).toEqual([200, 409]);
    expect(responses.find(result => result.status === 409)?.body).toMatchObject({
      error: expect.stringMatching(/already exists|already accepted/i),
    });

    const createdUsers = await prisma.user.findMany({
      where: { email: fixtureEmail },
      select: { id: true, email: true },
    });
    expect(createdUsers).toHaveLength(1);

    const decidedRequest = await prisma.userAddRequest.findUnique({
      where: { id: request.id },
      select: { status: true, createdUserId: true },
    });
    expect(decidedRequest).toEqual({
      status: 'accepted',
      createdUserId: createdUsers[0].id,
    });
  } finally {
    if (requestId) {
      await prisma.notification.deleteMany({
        where: { relatedEntityType: 'UserAddRequest', relatedEntityId: requestId },
      });
      await prisma.userAddRequest.deleteMany({ where: { id: requestId } });
    }
    await prisma.user.deleteMany({ where: { email: fixtureEmail } });
  }
});
