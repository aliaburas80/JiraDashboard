// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Admin user management API tests.

const mockSession = {
  isLoggedIn: true,
  role: 'admin',
  userId: 'admin-1',
  email: 'admin@test.com',
  name: 'Admin',
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(async () => 'HASHED_PASSWORD'),
  validatePasswordStrength: jest.fn(() => null),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditEvent: { create: jest.fn() },
  },
}));
jest.mock('@/services/storage/cloudSync', () => ({
  syncFromCloud: jest.fn(async () => ({ status: 'cache-hit' })),
  pushToCloud: jest.fn(async () => ({ status: 'pushed' })),
}));

function request(body: unknown) {
  return { json: jest.fn(async () => body) } as any;
}

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Sam',
    email: 'sam@test.com',
    role: 'scrum_master',
    isActive: true,
    createdAt: new Date('2026-06-06T00:00:00.000Z'),
    updatedAt: new Date('2026-06-06T00:00:00.000Z'),
    lastLoginAt: null,
    _count: { importLogs: 0, snapshots: 0 },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.role = 'admin';
});

test('admin users API blocks non-admin users', async () => {
  mockSession.role = 'scrum_master';
  const { GET } = await import('../../app/api/admin/users/route');

  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body.error).toBe('Admin access required.');
});

test('admin users API creates a role-assigned user without returning password hash', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { syncFromCloud, pushToCloud } = await import('@/services/storage/cloudSync');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.user.create as jest.Mock).mockResolvedValue(user({ role: 'product_owner', mustChangePassword: true }));
  const { POST } = await import('../../app/api/admin/users/route');

  const response = await POST(request({
    name: 'Sam',
    email: 'SAM@Test.com',
    password: 'Password@123',
    role: 'product_owner',
  }));
  const body = await response.json();

  expect(response.status).toBe(201);
  expect(body.user.role).toBe('product_owner');
  expect(body.user.mustChangePassword).toBe(true);
  expect(body.user.passwordHash).toBeUndefined();
  expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ mustChangePassword: true }),
  }));
  expect(prisma.auditEvent.create).toHaveBeenCalled();
  expect(syncFromCloud).toHaveBeenCalled();
  expect(pushToCloud).toHaveBeenCalled();
});

test('admin users API updates role and active state', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { syncFromCloud, pushToCloud } = await import('@/services/storage/cloudSync');
  (prisma.user.update as jest.Mock).mockResolvedValue(user({ role: 'manager', isActive: false }));
  const { PATCH } = await import('../../app/api/admin/users/route');

  const response = await PATCH(request({ id: 'user-1', role: 'manager', isActive: false }));
  const body = await response.json();

  expect(body.ok).toBe(true);
  expect(body.user.role).toBe('manager');
  expect(body.user.isActive).toBe(false);
  expect(syncFromCloud).toHaveBeenCalled();
  expect(pushToCloud).toHaveBeenCalled();
});

test('admin users API blocks deleting the signed-in admin', async () => {
  const { DELETE } = await import('../../app/api/admin/users/route');

  const response = await DELETE(request({ id: 'admin-1' }));
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toBe('You cannot delete your own account.');
});

test('admin users API deletes another user and syncs cloud data', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { syncFromCloud, pushToCloud } = await import('@/services/storage/cloudSync');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(user({ id: 'user-2', email: 'delete@test.com' }));
  (prisma.user.delete as jest.Mock).mockResolvedValue(user({ id: 'user-2', email: 'delete@test.com' }));
  const { DELETE } = await import('../../app/api/admin/users/route');

  const response = await DELETE(request({ id: 'user-2' }));
  const body = await response.json();

  expect(body.ok).toBe(true);
  expect(body.deletedUserId).toBe('user-2');
  expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-2' } });
  expect(prisma.auditEvent.create).toHaveBeenCalled();
  expect(syncFromCloud).toHaveBeenCalled();
  expect(pushToCloud).toHaveBeenCalled();
});
