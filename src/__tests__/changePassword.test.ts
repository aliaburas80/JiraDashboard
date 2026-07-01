// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Forced first-login password-change route tests — TC-PW-08 to TC-PW-10.

export {};

const mockSession = {
  isLoggedIn: true,
  userId: 'user-1',
  role: 'scrum_master',
  email: 'sam@test.com',
  name: 'Sam',
  mustChangePassword: true,
  save: jest.fn(async () => {}),
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(async () => 'NEW_HASHED_PASSWORD'),
  verifyPassword: jest.fn(async (plain: string) => plain === 'Temp@1234'),
  validatePasswordStrength: jest.fn((pw: string) => (pw === 'Weak' ? 'Password is too weak.' : null)),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(async () => ({
        id: 'user-1',
        email: 'sam@test.com',
        passwordHash: 'OLD_HASHED_PASSWORD',
        isActive: true,
      })),
      update: jest.fn(async () => ({})),
    },
    auditEvent:    { create: jest.fn(async () => ({})) },
    loginAttempt:  {
      count:      jest.fn(async () => 0),
      create:     jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
  },
}));
jest.mock('@/services/storage/cloudSync', () => ({
  pushToCloud: jest.fn(async () => ({ status: 'pushed' })),
}));

function request(body: unknown) {
  return {
    json: jest.fn(async () => body),
    headers: { get: jest.fn(() => null) },
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.mustChangePassword = true;
});

test('TC-PW-08: change-password rejects a new password identical to the temporary password', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { POST } = await import('../../app/api/auth/change-password/route');

  const response = await POST(request({ currentPassword: 'Temp@1234', newPassword: 'Temp@1234' }));
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toBe('New password must be different from the temporary password.');
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test('TC-PW-09: change-password succeeds — clears mustChangePassword, writes audit event, updates session', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { hashPassword } = await import('@/lib/auth');
  const { pushToCloud } = await import('@/services/storage/cloudSync');
  const { POST } = await import('../../app/api/auth/change-password/route');

  const response = await POST(request({ currentPassword: 'Temp@1234', newPassword: 'Strong@5678' }));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(hashPassword).toHaveBeenCalledWith('Strong@5678');
  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data: { passwordHash: 'NEW_HASHED_PASSWORD', mustChangePassword: false },
  });
  expect(prisma.auditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ userId: 'user-1', eventType: 'password_change' }),
  }));
  expect(mockSession.mustChangePassword).toBe(false);
  expect(mockSession.save).toHaveBeenCalled();
  expect(pushToCloud).toHaveBeenCalled();
});

test('TC-PW-10: change-password rejects an incorrect current/temporary password and leaves mustChangePassword set', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { POST } = await import('../../app/api/auth/change-password/route');

  const response = await POST(request({ currentPassword: 'Wrong@0000', newPassword: 'Strong@5678' }));
  const body = await response.json();

  expect(response.status).toBe(401);
  expect(body.error).toBe('Current password is incorrect.');
  expect(prisma.user.update).not.toHaveBeenCalled();
  expect(mockSession.mustChangePassword).toBe(true);
  expect(mockSession.save).not.toHaveBeenCalled();
});
