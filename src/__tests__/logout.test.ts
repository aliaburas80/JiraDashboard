// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Logout route tests — TC-A-13 (added 2026-06-08 to close TRACE-02 / Gaps Summary
// COVER-11 — see TODO-List.md Section 8 / product/TEST_CASES.md §F3).

export {};

const mockSession = {
  isLoggedIn: true,
  userId: 'user-1',
  email: 'sam@test.com',
  destroy: jest.fn(),
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditEvent: { create: jest.fn(async () => ({})) },
  },
}));

function request() {
  return {
    headers: { get: jest.fn(() => null) },
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
  mockSession.email = 'sam@test.com';
});

test('TC-A-13a: logout writes a logout audit event and destroys the session for a logged-in user', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { POST } = await import('../../app/api/auth/logout/route');

  const response = await POST(request());
  const body = await response.json();

  expect(prisma.auditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ userId: 'user-1', eventType: 'logout' }),
  }));
  expect(mockSession.destroy).toHaveBeenCalled();
  expect(body).toEqual({ ok: true });
});

test('TC-A-13b: logout destroys the session and skips the audit event when no session is active', async () => {
  mockSession.isLoggedIn = false;
  mockSession.userId = '';
  const { prisma } = await import('@/lib/prisma');
  const { POST } = await import('../../app/api/auth/logout/route');

  const response = await POST(request());
  const body = await response.json();

  expect(prisma.auditEvent.create).not.toHaveBeenCalled();
  expect(mockSession.destroy).toHaveBeenCalled();
  expect(body).toEqual({ ok: true });
});
