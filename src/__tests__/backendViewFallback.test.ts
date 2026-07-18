// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/backend-view unauthenticated-fallback tests — SEC (2026-07-18,
// docs/product-audit/10-technical-cleanup.md Part 1 finding 2): the
// unauthenticated fallback used to read data/import-logs.json (a single
// flat file shared globally by every user with no per-user scoping) and
// return real filenames/row counts/statuses to any unauthenticated caller.
// It must now return no real import data at all while staying reachable
// (the route also serves as a public API index).

export {};

const mockSession: { isLoggedIn: boolean; userId?: string; role?: string; name?: string; email?: string } = {
  isLoggedIn: false,
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));

const findManyMock = jest.fn(async () => ([
  {
    id: 'il-1',
    uploadedAt: new Date('2026-07-01T00:00:00Z'),
    fileName: 'other-user-confidential-export.xlsx',
    rowCount: 500,
    status: 'success',
    fileSize: 12345,
    healthScore: 80,
    totalIssues: 500,
    user: { name: 'Other User', email: 'other@test.com' },
  },
]));

jest.mock('@/lib/prisma', () => ({
  prisma: { importLog: { findMany: findManyMock } },
}));

function reqWithNoParams() {
  return { nextUrl: new URL('http://localhost:3000/api/backend-view') } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = false;
  delete mockSession.userId;
  delete mockSession.role;
});

test('SEC-2026-07-18: unauthenticated request receives no real import data', async () => {
  const { GET } = await import('../../app/api/backend-view/route');

  const response = await GET(reqWithNoParams());
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.logs).toEqual([]);
  expect(body.stats.totalImports).toBeNull();
  expect(body.stats.lastFilename).toBeNull();
  expect(body.isAdmin).toBe(false);
  expect(body.currentUser).toBeNull();
  // The route still doubles as a public API index — that part is intentional and unchanged.
  expect(Array.isArray(body.endpoints)).toBe(true);
  expect(body.endpoints.length).toBeGreaterThan(0);
  // Never falls through to the DB layer's real data when there's no session.
  expect(findManyMock).not.toHaveBeenCalled();
});

test('an authenticated non-admin request still receives only their own scoped logs (unchanged behavior)', async () => {
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
  mockSession.role = 'scrum_master';
  mockSession.name = 'Sam';
  mockSession.email = 'sam@test.com';

  const { GET } = await import('../../app/api/backend-view/route');
  const response = await GET(reqWithNoParams());
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
    where: { userId: 'user-1' },
  }));
  // Non-admin never sees uploader identity, even for their own logs' shape.
  expect(body.logs[0].userName).toBeNull();
  expect(body.logs[0].userEmail).toBeNull();
});
