// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// TC-REQ-01 to TC-REQ-14 — User Add-Member Request Workflow
// USERREQ-07 Prisma models, USERREQ-10–14 API routes.

export {};

// ── Shared mock session state ─────────────────────────────────────────────────

const mockSession = {
  isLoggedIn: true,
  role: 'scrum_master' as string,
  userId: 'user-sm-1',
  email: 'sm@test.com',
  name: 'Sam SM',
};

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn(async () => 'HASHED_PW'),
  validatePasswordStrength: jest.fn(() => null),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userAddRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(body: unknown, searchParams: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/test');
  for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v);
  return {
    json: jest.fn(async () => body),
    text: jest.fn(async () => JSON.stringify(body)),
    headers: { get: jest.fn(() => null) },
    nextUrl: url,
  } as any;
}

function pendingRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'req-1',
    requestedName: 'Jane Doe',
    requestedEmail: 'jane@example.com',
    requestedRole: 'scrum_master',
    reason: 'New team member',
    teamOrProject: null,
    notes: null,
    status: 'pending',
    requestedByUserId: 'user-sm-1',
    adminDecisionById: null,
    adminDecisionAt: null,
    adminDecisionNote: null,
    createdUserId: null,
    createdAt: new Date('2026-06-09T00:00:00.000Z'),
    updatedAt: new Date('2026-06-09T00:00:00.000Z'),
    ...overrides,
  };
}

function createdUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-new-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'scrum_master',
    mustChangePassword: true,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.role = 'scrum_master';
  mockSession.userId = 'user-sm-1';
});

// ── TC-REQ-01: POST /api/user-add-requests — success ─────────────────────────

test('TC-REQ-01: POST /api/user-add-requests — authenticated user submits a valid request', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.userAddRequest.findFirst as jest.Mock).mockResolvedValue(null);
  (prisma.userAddRequest.create as jest.Mock).mockResolvedValue(
    pendingRequest({ requestedByUserId: 'user-sm-1' }),
  );
  const { POST } = await import('../../app/api/user-add-requests/route');

  const res = await POST(makeReq({
    requestedName: 'Jane Doe',
    requestedEmail: 'jane@example.com',
    requestedRole: 'scrum_master',
    reason: 'New sprint team member',
  }));
  const body = await res.json();

  expect(res.status).toBe(201);
  expect(body.ok).toBe(true);
  expect(body.request.requestedEmail).toBe('jane@example.com');
  expect(body.request.status).toBe('pending');
  expect(prisma.userAddRequest.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        requestedEmail: 'jane@example.com',
        requestedRole: 'scrum_master',
        status: 'pending',
        requestedByUserId: 'user-sm-1',
      }),
    }),
  );
});

// ── TC-REQ-02: POST /api/user-add-requests — unauthenticated blocked ──────────

test('TC-REQ-02: POST /api/user-add-requests — unauthenticated request returns 401', async () => {
  mockSession.isLoggedIn = false;
  const { POST } = await import('../../app/api/user-add-requests/route');

  const res = await POST(makeReq({
    requestedName: 'Jane',
    requestedEmail: 'jane@example.com',
    requestedRole: 'scrum_master',
    reason: 'Test',
  }));

  expect(res.status).toBe(401);
});

// ── TC-REQ-03: POST /api/user-add-requests — duplicate email (existing user) ─

test('TC-REQ-03: POST /api/user-add-requests — returns 409 when email already has an account', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-1', email: 'jane@example.com' });
  (prisma.userAddRequest.findFirst as jest.Mock).mockResolvedValue(null);
  const { POST } = await import('../../app/api/user-add-requests/route');

  const res = await POST(makeReq({
    requestedName: 'Jane',
    requestedEmail: 'jane@example.com',
    requestedRole: 'scrum_master',
    reason: 'Reason',
  }));
  const body = await res.json();

  expect(res.status).toBe(409);
  expect(body.error).toMatch(/already exists/i);
  expect(prisma.userAddRequest.create).not.toHaveBeenCalled();
});

// ── TC-REQ-04: POST /api/user-add-requests — duplicate pending request ────────

test('TC-REQ-04: POST /api/user-add-requests — returns 409 when a pending request for same email exists', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.userAddRequest.findFirst as jest.Mock).mockResolvedValue(pendingRequest());
  const { POST } = await import('../../app/api/user-add-requests/route');

  const res = await POST(makeReq({
    requestedName: 'Jane',
    requestedEmail: 'jane@example.com',
    requestedRole: 'scrum_master',
    reason: 'Reason',
  }));
  const body = await res.json();

  expect(res.status).toBe(409);
  expect(body.error).toMatch(/pending request/i);
  expect(prisma.userAddRequest.create).not.toHaveBeenCalled();
});

// ── TC-REQ-05: POST /api/user-add-requests — missing required fields ──────────

test('TC-REQ-05: POST /api/user-add-requests — returns 400 when required fields are missing', async () => {
  const { POST } = await import('../../app/api/user-add-requests/route');

  const res = await POST(makeReq({ requestedEmail: 'jane@example.com' }));
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toMatch(/required/i);
});

// ── TC-REQ-06: GET /api/user-add-requests/mine — returns own requests ─────────

test('TC-REQ-06: GET /api/user-add-requests/mine — returns requester\'s own requests', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.userAddRequest.findMany as jest.Mock).mockResolvedValue([pendingRequest()]);
  const { GET } = await import('../../app/api/user-add-requests/mine/route');

  const res = await GET();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.requests).toHaveLength(1);
  expect(body.requests[0].requestedEmail).toBe('jane@example.com');
  expect(prisma.userAddRequest.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { requestedByUserId: 'user-sm-1' },
    }),
  );
});

// ── TC-REQ-07: GET /api/user-add-requests/mine — unauthenticated blocked ──────

test('TC-REQ-07: GET /api/user-add-requests/mine — unauthenticated request returns 401', async () => {
  mockSession.isLoggedIn = false;
  const { GET } = await import('../../app/api/user-add-requests/mine/route');

  const res = await GET();
  expect(res.status).toBe(401);
});

// ── TC-REQ-08: GET /api/admin/user-add-requests — admin sees all requests ─────

test('TC-REQ-08: GET /api/admin/user-add-requests — admin can list all requests', async () => {
  mockSession.role = 'admin';
  const { prisma } = await import('@/lib/prisma');
  (prisma.userAddRequest.findMany as jest.Mock).mockResolvedValue([
    {
      ...pendingRequest(),
      requestedBy: { id: 'user-sm-1', name: 'Sam SM', email: 'sm@test.com', role: 'scrum_master' },
    },
  ]);
  const { GET } = await import('../../app/api/admin/user-add-requests/route');

  const res = await GET(makeReq(null));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.requests).toHaveLength(1);
  expect(body.requests[0].requestedBy.email).toBe('sm@test.com');
});

// ── TC-REQ-09: GET /api/admin/user-add-requests — non-admin blocked ───────────

test('TC-REQ-09: GET /api/admin/user-add-requests — non-admin returns 403', async () => {
  mockSession.role = 'scrum_master';
  const { GET } = await import('../../app/api/admin/user-add-requests/route');

  const res = await GET(makeReq(null));
  const body = await res.json();

  expect(res.status).toBe(403);
  expect(body.error).toBe('Admin access required.');
});

// ── TC-REQ-10: PATCH /api/admin/user-add-requests/:id/accept — success ────────

test('TC-REQ-10: PATCH accept — creates user, marks request accepted, creates notification', async () => {
  mockSession.role = 'admin';
  mockSession.userId = 'admin-1';
  const { prisma } = await import('@/lib/prisma');
  (prisma.userAddRequest.findUnique as jest.Mock).mockResolvedValue(pendingRequest());
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.user.create as jest.Mock).mockResolvedValue(createdUser());
  (prisma.userAddRequest.update as jest.Mock).mockResolvedValue({
    ...pendingRequest(), status: 'accepted', createdUserId: 'user-new-1',
  });
  (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });
  (prisma.auditEvent.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/accept/route');

  const res = await PATCH(makeReq({}), { params: { id: 'req-1' } });
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(body.createdUser.email).toBe('jane@example.com');
  expect(body.createdUser.mustChangePassword).toBe(true);
  expect(prisma.user.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ mustChangePassword: true }),
    }),
  );
  expect(prisma.userAddRequest.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'req-1' },
      data: expect.objectContaining({ status: 'accepted' }),
    }),
  );
  expect(prisma.notification.create).toHaveBeenCalled();
  expect(prisma.auditEvent.create).toHaveBeenCalled();
});

// ── TC-REQ-11: PATCH accept — 404 when request not found ──────────────────────

test('TC-REQ-11: PATCH accept — returns 404 when request does not exist', async () => {
  mockSession.role = 'admin';
  const { prisma } = await import('@/lib/prisma');
  (prisma.userAddRequest.findUnique as jest.Mock).mockResolvedValue(null);

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/accept/route');

  const res = await PATCH(makeReq({}), { params: { id: 'nonexistent' } });
  expect(res.status).toBe(404);
});

// ── TC-REQ-12: PATCH accept — 409 when request already decided ────────────────

test('TC-REQ-12: PATCH accept — returns 409 when request is already accepted or rejected', async () => {
  mockSession.role = 'admin';
  const { prisma } = await import('@/lib/prisma');
  (prisma.userAddRequest.findUnique as jest.Mock).mockResolvedValue(
    pendingRequest({ status: 'accepted' }),
  );

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/accept/route');

  const res = await PATCH(makeReq({}), { params: { id: 'req-1' } });
  const body = await res.json();

  expect(res.status).toBe(409);
  expect(body.error).toMatch(/already accepted/i);
});

// ── TC-REQ-13: PATCH reject — success ─────────────────────────────────────────

test('TC-REQ-13: PATCH reject — marks request rejected and creates notification', async () => {
  mockSession.role = 'admin';
  mockSession.userId = 'admin-1';
  const { prisma } = await import('@/lib/prisma');
  (prisma.userAddRequest.findUnique as jest.Mock).mockResolvedValue(pendingRequest());
  (prisma.userAddRequest.update as jest.Mock).mockResolvedValue({
    ...pendingRequest(), status: 'rejected',
  });
  (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-2' });
  (prisma.auditEvent.create as jest.Mock).mockResolvedValue({ id: 'audit-2' });

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/reject/route');

  const res = await PATCH(makeReq({ decisionNote: 'Role not approved at this time.' }), { params: { id: 'req-1' } });
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(prisma.userAddRequest.update).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'req-1' },
      data: expect.objectContaining({ status: 'rejected' }),
    }),
  );
  expect(prisma.notification.create).toHaveBeenCalled();
  expect(prisma.auditEvent.create).toHaveBeenCalled();
});

// ── TC-REQ-14: PATCH reject — 409 when request already decided ────────────────

test('TC-REQ-14: PATCH reject — returns 409 when request is not pending', async () => {
  mockSession.role = 'admin';
  const { prisma } = await import('@/lib/prisma');
  (prisma.userAddRequest.findUnique as jest.Mock).mockResolvedValue(
    pendingRequest({ status: 'rejected' }),
  );

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/reject/route');

  const res = await PATCH(makeReq({}), { params: { id: 'req-1' } });
  const body = await res.json();

  expect(res.status).toBe(409);
  expect(body.error).toMatch(/already rejected/i);
});
