// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0A-04 gate Phase 2: negative-access tests for admin routes that had none.
// These 4 routes (diagnostics, audit-events, system-errors, feedback) run
// unscoped, global Prisma queries — verified during the P0-A audit to each be
// gated by an admin-role check rather than userId/workspaceId scoping (an
// intentional design for global-admin-only routes, not an IDOR gap). This
// suite closes the one real gap found: nothing asserted that gate actually
// rejects a non-admin caller before those queries ever run.

export {};

let mockSession: { isLoggedIn: boolean; role?: string; userId?: string } = { isLoggedIn: true, role: 'admin', userId: 'admin-1' };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: new Proxy({}, {
    get: () => new Proxy({}, { get: () => jest.fn(async () => { throw new Error('Prisma must not be queried when the admin guard rejects the caller.'); }) }),
  }),
}));

function nextRequest(url = 'http://localhost/api/admin/x') {
  return {
    headers: { get: () => null },
    nextUrl: new URL(url),
    url,
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = { isLoggedIn: true, role: 'scrum_master', userId: 'user-1' };
});

test('TC-ADM-01: GET /api/admin/diagnostics rejects a non-admin session with 403', async () => {
  const { GET } = await import('../../app/api/admin/diagnostics/route');
  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body.error).toBe('Admin access required.');
});

test('TC-ADM-02: GET /api/admin/audit-events rejects a non-admin session with 403', async () => {
  const { GET } = await import('../../app/api/admin/audit-events/route');
  const response = await GET(nextRequest('http://localhost/api/admin/audit-events'));
  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body.error).toBe('Forbidden');
});

test('TC-ADM-03: GET /api/admin/system-errors rejects a non-admin session with 403', async () => {
  const { GET } = await import('../../app/api/admin/system-errors/route');
  const response = await GET(nextRequest('http://localhost/api/admin/system-errors'));
  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body.error).toBe('Admin access required.');
});

test('TC-ADM-04: GET /api/admin/feedback rejects a non-admin session with 403', async () => {
  const { GET } = await import('../../app/api/admin/feedback/route');
  const response = await GET(nextRequest('http://localhost/api/admin/feedback'));
  const body = await response.json();

  expect(response.status).toBe(403);
  expect(body.error).toBe('Forbidden');
});

test('TC-ADM-05: an unauthenticated caller is rejected (401 or 403), not served admin data', async () => {
  mockSession = { isLoggedIn: false };

  const { GET: diagnosticsGet } = await import('../../app/api/admin/diagnostics/route');
  const diagResponse = await diagnosticsGet();
  expect([401, 403]).toContain(diagResponse.status);

  const { GET: systemErrorsGet } = await import('../../app/api/admin/system-errors/route');
  const errResponse = await systemErrorsGet(nextRequest('http://localhost/api/admin/system-errors'));
  expect([401, 403]).toContain(errResponse.status);
});
