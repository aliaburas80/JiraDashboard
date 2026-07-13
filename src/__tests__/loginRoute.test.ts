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
  DUMMY_PASSWORD_HASH: 'DUMMY_HASH_FOR_TIMING_SAFETY',
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

// AUDIT-SEC (login enumeration, 2026-07-13): previously returned a distinct
// 404 with "no account exists" messaging and a { code: 'USER_NOT_FOUND' }
// body, letting a caller distinguish a registered email from an unregistered
// one -- inconsistent with every sibling auth endpoint (forgot-password,
// register, resend-verification), which already return identical generic
// responses regardless of account existence. Fixed to match that pattern.
test('TC-LOGIN-01: unknown email returns the same generic 401 as a wrong password, not a distinguishing 404', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

  const res = await POST(request({ email: 'new@test.com', password: 'Correct@1' }));
  const body = await res.json();

  expect(res.status).toBe(401);
  expect(body.code).toBeUndefined();
  expect(body.error).toBe('Invalid email or password.');
});

test('TC-LOGIN-01b: unknown-email and wrong-password responses are indistinguishable (status + body)', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
  const unknownRes = await POST(request({ email: 'ghost@test.com', password: 'whatever' }));
  const unknownBody = await unknownRes.json();

  (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
    id: 'user-1', name: 'Sam', email: 'sam@test.com', passwordHash: 'HASH',
    isActive: true, emailVerified: true, role: 'user', mustChangePassword: false, dataStorageMode: 'cloud',
  });
  const wrongPassRes = await POST(request({ email: 'sam@test.com', password: 'Wrong@999' }));
  const wrongPassBody = await wrongPassRes.json();

  expect(unknownRes.status).toBe(wrongPassRes.status);
  expect(unknownBody).toEqual(wrongPassBody);
});

test('TC-LOGIN-02: unverified email can still sign in, and the session records emailVerified: false', async () => {
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

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(mockSession.save).toHaveBeenCalled();
  expect((mockSession as any).emailVerified).toBe(false);
});
