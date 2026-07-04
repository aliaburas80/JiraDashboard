// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// TC-NOTIF-01 to TC-NOTIF-05 — In-App Notification API
// FR-322: GET /api/notifications + PATCH /api/notifications/[id]/read

export {};

const mockSession = {
  isLoggedIn: true,
  userId: 'user-1',
  role: 'scrum_master' as string,
  email: 'sm@test.com',
  name: 'Sam SM',
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('@/lib/session', () => ({
  SESSION_OPTIONS: {},
}));

function makeReq(body: unknown = null, url = 'http://localhost/api/notifications') {
  return {
    json: jest.fn(async () => body),
    text: jest.fn(async () => JSON.stringify(body)),
    headers: { get: jest.fn(() => null) },
    nextUrl: new URL(url),
  } as any;
}

function sampleNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notif-1',
    recipientUserId: 'user-1',
    type: 'user_add_request_accepted',
    title: '✅ User request approved',
    message: 'Your request to add jane@example.com as Scrum Master has been approved.',
    relatedEntityType: 'UserAddRequest',
    relatedEntityId: 'req-1',
    readAt: null,
    createdAt: new Date('2026-06-09T10:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.resetModules();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
  mockSession.role = 'scrum_master';
});

// ── TC-NOTIF-01: GET /api/notifications — authenticated user receives notifications

test('TC-NOTIF-01: GET /api/notifications — returns notifications for current user', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.notification.findMany as jest.Mock).mockResolvedValue([sampleNotification()]);

  const { GET } = await import('../../app/api/notifications/route');

  const res = await GET();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.notifications).toHaveLength(1);
  expect(body.notifications[0].id).toBe('notif-1');
  expect(prisma.notification.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: { recipientUserId: 'user-1' } }),
  );
});

// ── TC-NOTIF-02: GET /api/notifications — unauthenticated → 401

test('TC-NOTIF-02: GET /api/notifications — unauthenticated request returns 401', async () => {
  mockSession.isLoggedIn = false;

  const { GET } = await import('../../app/api/notifications/route');

  const res = await GET();
  const body = await res.json();

  expect(res.status).toBe(401);
  expect(body.error).toMatch(/not authenticated/i);
});

// ── TC-NOTIF-03: PATCH /api/notifications/[id]/read — marks notification as read

test('TC-NOTIF-03: PATCH /api/notifications/[id]/read — marks notification as read', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.notification.findUnique as jest.Mock).mockResolvedValue(sampleNotification());
  (prisma.notification.update as jest.Mock).mockResolvedValue({ ...sampleNotification(), readAt: new Date() });

  const { PATCH } = await import('../../app/api/notifications/[id]/read/route');

  const res = await PATCH(makeReq(null), { params: { id: 'notif-1' } });
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(prisma.notification.update).toHaveBeenCalledWith(
    expect.objectContaining({ where: { id: 'notif-1' }, data: expect.objectContaining({ readAt: expect.any(Date) }) }),
  );
});

// ── TC-NOTIF-04: PATCH /api/notifications/[id]/read — unauthenticated → 401

test('TC-NOTIF-04: PATCH /api/notifications/[id]/read — unauthenticated returns 401', async () => {
  mockSession.isLoggedIn = false;

  const { PATCH } = await import('../../app/api/notifications/[id]/read/route');

  const res = await PATCH(makeReq(null), { params: { id: 'notif-1' } });
  const body = await res.json();

  expect(res.status).toBe(401);
  expect(body.error).toMatch(/not authenticated/i);
});

// ── TC-NOTIF-05: PATCH /api/notifications/[id]/read — another user's notification → 404

test('TC-NOTIF-05: PATCH /api/notifications/[id]/read — cannot mark another user\'s notification as read', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.notification.findUnique as jest.Mock).mockResolvedValue(
    sampleNotification({ recipientUserId: 'other-user-99' }),
  );

  const { PATCH } = await import('../../app/api/notifications/[id]/read/route');

  const res = await PATCH(makeReq(null), { params: { id: 'notif-1' } });
  const body = await res.json();

  expect(res.status).toBe(404);
  expect(body.error).toMatch(/not found/i);
});
