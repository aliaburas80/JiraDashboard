// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-017: GET/PATCH /api/profile dataStorageMode tests — TC-PROF-01 to TC-PROF-05

export {};

const mockSession: Record<string, unknown> = {
  isLoggedIn: true,
  userId: 'user-1',
  email: 'sam@test.com',
  name: 'Sam',
  save: jest.fn(async () => {}),
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    auditEvent: { create: jest.fn(async () => ({})) },
  },
}));
jest.mock('@/services/storage/cloudSync', () => ({
  syncFromCloud: jest.fn(async () => ({ status: 'cache-hit' })),
  pushToCloud: jest.fn(async () => ({ status: 'pushed' })),
}));

function request(body: unknown) {
  return { json: jest.fn(async () => body), headers: { get: () => null } } as any;
}

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Sam',
    email: 'sam@test.com',
    role: 'scrum_master',
    avatarUrl: null,
    position: null,
    phone: null,
    contactEmail: null,
    address: null,
    certificates: null,
    bio: null,
    dataStorageMode: 'cloud',
    updatedAt: new Date('2026-07-04T00:00:00.000Z'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
});

test('TC-PROF-01: GET /api/profile returns dataStorageMode, defaulting unset/invalid values to "cloud"', async () => {
  const { prisma } = jest.requireMock('@/lib/prisma');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(user({ dataStorageMode: undefined }));

  const { GET } = await import('../../app/api/profile/route');
  const res = await GET();
  const body = await res.json();

  expect(body.profile.dataStorageMode).toBe('cloud');
});

test('TC-PROF-02: PATCH /api/profile accepts dataStorageMode: "local" and persists it', async () => {
  const { prisma } = jest.requireMock('@/lib/prisma');
  (prisma.user.update as jest.Mock).mockResolvedValue(user({ dataStorageMode: 'local' }));

  const { PATCH } = await import('../../app/api/profile/route');
  const res = await PATCH(request({ name: 'Sam', dataStorageMode: 'local' }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.profile.dataStorageMode).toBe('local');
  expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ dataStorageMode: 'local' }),
  }));
});

test('TC-PROF-03: PATCH /api/profile rejects an invalid dataStorageMode value', async () => {
  const { PATCH } = await import('../../app/api/profile/route');
  const res = await PATCH(request({ name: 'Sam', dataStorageMode: 'somewhere-else' }));

  expect(res.status).toBe(400);
});

test('TC-PROF-04: PATCH /api/profile updates the session so subsequent requests see the new mode', async () => {
  const { prisma } = jest.requireMock('@/lib/prisma');
  (prisma.user.update as jest.Mock).mockResolvedValue(user({ dataStorageMode: 'local' }));

  const { PATCH } = await import('../../app/api/profile/route');
  await PATCH(request({ name: 'Sam', dataStorageMode: 'local' }));

  expect(mockSession.dataStorageMode).toBe('local');
});

test('TC-PROF-05: PATCH /api/profile without dataStorageMode leaves the field untouched', async () => {
  const { prisma } = jest.requireMock('@/lib/prisma');
  (prisma.user.update as jest.Mock).mockResolvedValue(user());

  const { PATCH } = await import('../../app/api/profile/route');
  await PATCH(request({ name: 'Sam' }));

  const callArgs = (prisma.user.update as jest.Mock).mock.calls[0][0];
  expect(callArgs.data.dataStorageMode).toBeUndefined();
});

test('TC-PROF-06: GET /api/profile returns emailVerified', async () => {
  const { prisma } = jest.requireMock('@/lib/prisma');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(user({ emailVerified: false }));

  const { GET } = await import('../../app/api/profile/route');
  const res = await GET();
  const body = await res.json();

  expect(body.profile.emailVerified).toBe(false);
});

test('TC-PROF-07: PATCH /api/profile ignores an emailVerified field in the request body — a user cannot self-verify', async () => {
  const { prisma } = jest.requireMock('@/lib/prisma');
  (prisma.user.update as jest.Mock).mockResolvedValue(user({ emailVerified: false }));

  const { PATCH } = await import('../../app/api/profile/route');
  await PATCH(request({ name: 'Sam', emailVerified: true }));

  const callArgs = (prisma.user.update as jest.Mock).mock.calls[0][0];
  expect(callArgs.data.emailVerified).toBeUndefined();
});
