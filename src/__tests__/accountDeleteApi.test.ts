// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-04: POST /api/account/delete — self-service account deletion request.

export {};

const mockSession: Record<string, unknown> = { isLoggedIn: true, userId: 'user-1', destroy: jest.fn() };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));

const mockUserFindUnique = jest.fn();
const mockLoginAttemptFindMany   = jest.fn();
const mockLoginAttemptDeleteMany = jest.fn();
const mockLoginAttemptCreate     = jest.fn();
const mockAuditCreate            = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => mockUserFindUnique(...a) },
    loginAttempt: {
      findMany:   (...a: unknown[]) => mockLoginAttemptFindMany(...a),
      deleteMany: (...a: unknown[]) => mockLoginAttemptDeleteMany(...a),
      create:     (...a: unknown[]) => mockLoginAttemptCreate(...a),
    },
    auditEvent: { create: (...a: unknown[]) => mockAuditCreate(...a) },
  },
}));

const mockVerifyPassword = jest.fn();
jest.mock('@/lib/auth', () => ({
  verifyPassword: (...a: unknown[]) => mockVerifyPassword(...a),
}));

const mockRequestAccountDeletion = jest.fn();
jest.mock('@/lib/accountLifecycle', () => ({
  requestAccountDeletion: (...a: unknown[]) => mockRequestAccountDeletion(...a),
}));

function request(body: unknown) {
  return {
    headers: { get: () => null },
    json:    jest.fn(async () => body),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
  mockUserFindUnique.mockResolvedValue({ id: 'user-1', email: 'sam@test.com', passwordHash: 'hash', isActive: true });
  mockLoginAttemptFindMany.mockResolvedValue([]);
  mockLoginAttemptDeleteMany.mockResolvedValue({ count: 0 });
  mockLoginAttemptCreate.mockResolvedValue({});
  mockAuditCreate.mockResolvedValue({});
  mockVerifyPassword.mockResolvedValue(true);
  mockRequestAccountDeletion.mockResolvedValue(undefined);
});

test('rejects an unauthenticated request with 401', async () => {
  mockSession.isLoggedIn = false;
  const { POST } = await import('../../app/api/account/delete/route');
  const res = await POST(request({ password: 'x' }));

  expect(res.status).toBe(401);
  expect(mockRequestAccountDeletion).not.toHaveBeenCalled();
});

test('rejects a missing password with 400', async () => {
  const { POST } = await import('../../app/api/account/delete/route');
  const res = await POST(request({}));

  expect(res.status).toBe(400);
  expect(mockRequestAccountDeletion).not.toHaveBeenCalled();
});

test('rejects an incorrect password with 401 and never requests deletion', async () => {
  mockVerifyPassword.mockResolvedValue(false);
  const { POST } = await import('../../app/api/account/delete/route');
  const res = await POST(request({ password: 'wrong' }));

  expect(res.status).toBe(401);
  expect(mockRequestAccountDeletion).not.toHaveBeenCalled();
  expect(mockSession.destroy).not.toHaveBeenCalled();
});

test('a correct password requests deletion, destroys the session, and writes an audit event', async () => {
  const { POST } = await import('../../app/api/account/delete/route');
  const res = await POST(request({ password: 'correct-password' }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(mockRequestAccountDeletion).toHaveBeenCalledWith('user-1');
  expect(mockSession.destroy).toHaveBeenCalled();
  expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ eventType: 'account_deletion_requested', userId: 'user-1' }),
  }));
});

test('rejects with 429 after too many attempts', async () => {
  mockLoginAttemptFindMany.mockResolvedValue(new Array(10).fill({ attemptedAt: new Date() }));
  const { POST } = await import('../../app/api/account/delete/route');
  const res = await POST(request({ password: 'x' }));

  expect(res.status).toBe(429);
  expect(mockRequestAccountDeletion).not.toHaveBeenCalled();
});
