// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/auth/login route behavior.

export {};

const mockSession = {
  userId: null as string | null,
  email: null as string | null,
  name: null as string | null,
  role: null as string | null,
  isLoggedIn: false,
  save: jest.fn(async () => {}),
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/services/storage/cloudSync', () => ({
  syncFromCloud: jest.fn(async () => ({ status: 'ok', source: 'mock' })),
}));
jest.mock('@/lib/auth', () => ({
  verifyPassword: jest.fn(async (plain: string) => plain === 'Correct@1'),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(async () => ({})),
    },
    auditEvent: {
      create: jest.fn(async () => ({})),
    },
    loginAttempt: {
      findMany: jest.fn(async () => []),
      create: jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { POST } from '../../app/api/auth/login/route';

function request(body: unknown) {
  const url = 'http://localhost/api/auth/login';
  return {
    headers: { get: () => '127.0.0.1' },
    json: jest.fn(async () => body),
    nextUrl: new URL(url),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.userId = null;
  mockSession.email = null;
  mockSession.name = null;
  mockSession.role = null;
  mockSession.isLoggedIn = false;
});

test('TC-LOGIN-01: unknown email tells the client to register', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

  const res = await POST(request({ email: 'new@test.com', password: 'Correct@1' }));
  const body = await res.json();

  expect(res.status).toBe(404);
  expect(body).toEqual(expect.objectContaining({
    code: 'USER_NOT_FOUND',
    registerPath: '/register',
  }));
  expect(body.error).toMatch(/no delivery clarity account/i);
});

test('TC-LOGIN-02: unverified email cannot sign in and can request verification resend', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'user-1',
    name: 'Sam',
    email: 'sam@test.com',
    passwordHash: 'HASH',
    isActive: true,
    emailVerified: false,
    role: 'user',
    mustChangePassword: false,
    dataStorageMode: 'local',
  });

  const res = await POST(request({ email: 'sam@test.com', password: 'Correct@1' }));
  const body = await res.json();

  expect(res.status).toBe(403);
  expect(body).toEqual(expect.objectContaining({
    code: 'EMAIL_NOT_VERIFIED',
    canResendVerification: true,
  }));
  expect(body.error).toMatch(/verify your email/i);
  expect(mockSession.save).not.toHaveBeenCalled();
  expect(prisma.user.update).not.toHaveBeenCalled();
});
