// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// TC-REQ-01 to TC-REQ-20 — User Add-Member Request Workflow
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
      findMany: jest.fn(async () => []),
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma';

// POST /api/user-add-requests looks up prisma.user.findUnique twice: once by
// `where.id` (the ghost-session requester guard) and once by `where.email`
// (existing-account check). Tests configure the email-lookup result via this
// variable; the id-lookup always resolves to a live requester by default.
let mockExistingUserByEmail: { id: string; email: string } | null = null;

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
  mockExistingUserByEmail = null;
  (prisma.user.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id?: string; email?: string } }) =>
    where?.id ? { id: where.id } : mockExistingUserByEmail,
  );
});

// ── TC-REQ-01: POST /api/user-add-requests — success ─────────────────────────

test('TC-REQ-01: POST /api/user-add-requests — authenticated user submits a valid request', async () => {
  const { prisma } = await import('@/lib/prisma');
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
  expect(prisma.auditEvent.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ eventType: 'user_add_request_submit' }),
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
  mockExistingUserByEmail = { id: 'existing-1', email: 'jane@example.com' };
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
  (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });
  (prisma.auditEvent.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/accept/route');

  const res = await PATCH(makeReq({ tempPassword: 'ValidPass1' }), { params: { id: 'req-1' } });
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
  expect(prisma.notification.createMany).toHaveBeenCalled();
  expect(prisma.auditEvent.create).toHaveBeenCalled();
});

// ── TC-REQ-11: PATCH accept — 404 when request not found ──────────────────────

test('TC-REQ-11: PATCH accept — returns 404 when request does not exist', async () => {
  mockSession.role = 'admin';
  const { prisma } = await import('@/lib/prisma');
  (prisma.userAddRequest.findUnique as jest.Mock).mockResolvedValue(null);

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/accept/route');

  const res = await PATCH(makeReq({ tempPassword: 'ValidPass1' }), { params: { id: 'nonexistent' } });
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

  const res = await PATCH(makeReq({ tempPassword: 'ValidPass1' }), { params: { id: 'req-1' } });
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
  (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });
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
  expect(prisma.notification.createMany).toHaveBeenCalled();
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

// ── TC-REQ-15: PATCH accept — 400 when tempPassword missing ───────────────────

test('TC-REQ-15: PATCH accept — returns 400 when tempPassword is not supplied', async () => {
  mockSession.role = 'admin';

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/accept/route');

  const res = await PATCH(makeReq({}), { params: { id: 'req-1' } });
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toMatch(/temporary password is required/i);
});

// ── TC-REQ-16: PATCH accept — 400 when tempPassword fails strength check ──────

test('TC-REQ-16: PATCH accept — returns 400 when tempPassword fails strength validation', async () => {
  mockSession.role = 'admin';
  const { validatePasswordStrength } = await import('@/lib/auth');
  (validatePasswordStrength as jest.Mock).mockReturnValueOnce('Password must be at least 8 characters.');

  const { PATCH } = await import('../../app/api/admin/user-add-requests/[id]/accept/route');

  const res = await PATCH(makeReq({ tempPassword: 'weak' }), { params: { id: 'req-1' } });
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toMatch(/8 characters/i);
});

// ── TC-REQ-18: POST /api/user-add-requests — rate limiting ────────────────────

test('TC-REQ-18: POST /api/user-add-requests — 11th submission from the same user in 10 minutes returns 429', async () => {
  // Fresh module registry so this test's submission count isn't polluted by
  // the rate limiter's module-level Map being shared with earlier tests.
  jest.resetModules();
  const { prisma } = await import('@/lib/prisma');
  (prisma.user.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id?: string; email?: string } }) =>
    where?.id ? { id: where.id } : null,
  );
  (prisma.userAddRequest.findFirst as jest.Mock).mockResolvedValue(null);
  (prisma.userAddRequest.create as jest.Mock).mockResolvedValue(pendingRequest());
  const { POST } = await import('../../app/api/user-add-requests/route');

  const body = {
    requestedName: 'Jane Doe',
    requestedEmail: 'jane@example.com',
    requestedRole: 'scrum_master',
    reason: 'New sprint team member',
  };

  for (let i = 0; i < 10; i++) {
    const res = await POST(makeReq(body));
    expect(res.status).toBe(201);
  }
  const blocked = await POST(makeReq(body));
  expect(blocked.status).toBe(429);
  const blockedBody = await blocked.json();
  expect(blockedBody.error).toMatch(/too many requests/i);
});

// ── TC-REQ-19: POST /api/user-add-requests — invalid email format rejected ────
// USERREQ — server-side enforcement of the email-format rule that previously
// only existed client-side in RequestAddMemberModal.tsx; a direct API call
// could otherwise bypass it entirely.

test('TC-REQ-19: POST /api/user-add-requests — returns 400 when email format is invalid', async () => {
  mockSession.userId = 'user-req-19';
  const { POST } = await import('../../app/api/user-add-requests/route');

  const res = await POST(makeReq({
    requestedName: 'Jane Doe',
    requestedEmail: 'not-an-email',
    requestedRole: 'scrum_master',
    reason: 'New sprint team member',
  }));
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toMatch(/valid email/i);
  expect(prisma.userAddRequest.create).not.toHaveBeenCalled();
});

// ── TC-REQ-20: POST /api/user-add-requests — high-privilege role requires a
// detailed reason, enforced server-side ───────────────────────────────────────

test('TC-REQ-20: POST /api/user-add-requests — returns 400 when an admin/c_level request has a reason under 20 characters', async () => {
  mockSession.userId = 'user-req-20';
  const { POST } = await import('../../app/api/user-add-requests/route');

  const res = await POST(makeReq({
    requestedName: 'Jane Doe',
    requestedEmail: 'jane@example.com',
    requestedRole: 'admin',
    reason: 'short',
  }));
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toMatch(/detailed justification/i);
  expect(prisma.userAddRequest.create).not.toHaveBeenCalled();
});

test('TC-REQ-20b: POST /api/user-add-requests — accepts an admin/c_level request with a sufficiently detailed reason', async () => {
  mockSession.userId = 'user-req-20b';
  (prisma.userAddRequest.findFirst as jest.Mock).mockResolvedValue(null);
  (prisma.userAddRequest.create as jest.Mock).mockResolvedValue(
    pendingRequest({ requestedRole: 'admin', reason: 'Needs full admin access to manage the new release pipeline.' }),
  );
  const { POST } = await import('../../app/api/user-add-requests/route');

  const res = await POST(makeReq({
    requestedName: 'Jane Doe',
    requestedEmail: 'jane@example.com',
    requestedRole: 'admin',
    reason: 'Needs full admin access to manage the new release pipeline.',
  }));

  expect(res.status).toBe(201);
});
