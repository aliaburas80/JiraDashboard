// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-008/EP-009: Cross-workspace negative access tests.
// Proves User A cannot read or delete User B's data even with a valid session.
// These are security regression tests — any failure is a critical security defect.

export {};

// ── Shared fixture ─────────────────────────────────────────────────────────────

const USER_A_ID   = 'user-a';
const USER_B_ID   = 'user-b';
const WS_A_ID     = 'ws-a';
const WS_B_ID     = 'ws-b';
const IMPORT_B_ID = 'import-b';   // belongs to User B / workspace B
const SNAP_B_ID   = 'snap-b';     // belongs to User B / workspace B

// Session: User A is logged in
const sessionA = { isLoggedIn: true, role: 'user', userId: USER_A_ID, email: 'a@test.com', name: 'Alice' };

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFindFirst      = jest.fn();
const mockFindMany       = jest.fn();
const mockDeleteMany     = jest.fn();
const mockImportDelete   = jest.fn();
const mockSnapshotDelete = jest.fn();

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({ getIronSession: jest.fn(async () => sessionA) }));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    importLog: {
      findMany:  (...a: unknown[]) => mockFindMany(...a),
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      findUnique: (...a: unknown[]) => mockFindFirst(...a),
      delete:    (...a: unknown[]) => mockImportDelete(...a),
      deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
      count:     jest.fn(async () => 0),
    },
    dashboardSnapshot: {
      findMany:   (...a: unknown[]) => mockFindMany(...a),
      findFirst:  (...a: unknown[]) => mockFindFirst(...a),
      findUnique: (...a: unknown[]) => mockFindFirst(...a),
      delete:     (...a: unknown[]) => mockSnapshotDelete(...a),
      count:      jest.fn(async () => 0),
    },
    auditEvent: { create: jest.fn(async () => ({})) },
    loginAttempt: {
      findMany:   jest.fn(async () => []),
      deleteMany: jest.fn(async () => ({})),
      create:     jest.fn(async () => ({})),
    },
  },
}));

// getWorkspaceForUser always returns User A's workspace
jest.mock('@/lib/workspace', () => ({
  getWorkspaceForUser: jest.fn(async (userId: string) => {
    if (userId === USER_A_ID) return { id: WS_A_ID, name: 'Alice WS', slug: 'ws-a', status: 'active' };
    return null;
  }),
  createWorkspaceForUser: jest.fn(),
}));

jest.mock('@/lib/roles', () => ({
  canViewAllImportData: jest.fn(() => false),
}));
jest.mock('@/services/imports/importLogs.service', () => ({
  readImportLogs: jest.fn(() => []),
  appendImportLog: jest.fn(),
  buildImportLog: jest.fn(),
}));
jest.mock('@/services/storage/cloudSync', () => ({
  syncFromCloud: jest.fn(async () => ({ status: 'cache-hit' })),
  pushToCloud:   jest.fn(async () => ({})),
}));

beforeEach(() => { jest.clearAllMocks(); });

// ── TC-ISO-01: imports list only returns User A's workspace records ─────────────

test('TC-ISO-01: GET /api/imports only returns records from the authenticated user workspace', async () => {
  // Simulate DB returning only workspace A records (the WHERE clause does the filtering)
  const wsARecord = { id: 'import-a', userId: USER_A_ID, workspaceId: WS_A_ID, status: 'success', uploadedAt: new Date() };
  mockFindMany.mockResolvedValueOnce([wsARecord]);

  const { GET } = await import('../../app/api/imports/route');
  const req = { nextUrl: { searchParams: new URLSearchParams() } } as any;
  const res = await GET(req);
  const body = await res.json();

  // The query must have included workspaceId: WS_A_ID in the WHERE clause
  expect(mockFindMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ workspaceId: WS_A_ID }),
    }),
  );
  // Response only contains the workspace A record
  expect(body.logs).toHaveLength(1);
  expect(body.logs[0].workspaceId).toBe(WS_A_ID);
});

// ── TC-ISO-02: snapshots list only returns User A's workspace records ──────────

test('TC-ISO-02: GET /api/snapshots only returns records from the authenticated user workspace', async () => {
  const snapA = { id: 'snap-a', userId: USER_A_ID, workspaceId: WS_A_ID, snapshotName: 'Alice snap', createdAt: new Date(), importLogId: null };
  mockFindMany.mockResolvedValueOnce([snapA]);

  const { GET } = await import('../../app/api/snapshots/route');
  const res  = await GET();
  const body = await res.json();

  expect(mockFindMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ workspaceId: WS_A_ID }),
    }),
  );
  expect(body.snapshots).toHaveLength(1);
});

// ── TC-ISO-03: GET snapshot by ID — returns 404 for a record in another workspace ─

test('TC-ISO-03: GET /api/snapshots/[id] returns 404 when snapshot belongs to another workspace', async () => {
  // findFirst returns null because workspaceId WS_B_ID ≠ WS_A_ID
  mockFindFirst.mockResolvedValueOnce(null);

  const { GET } = await import('../../app/api/snapshots/[id]/route');
  const res  = await GET({} as any, { params: { id: SNAP_B_ID } });
  const body = await res.json();

  expect(res.status).toBe(404);
  // Must NOT expose that the snapshot exists — 404, not 403
  expect(body.error).toMatch(/not found/i);
});

// ── TC-ISO-04: GET snapshot by ID — workspace-scoped query is issued ───────────

test('TC-ISO-04: GET /api/snapshots/[id] queries with workspaceId scope', async () => {
  mockFindFirst.mockResolvedValueOnce(null);

  const { GET } = await import('../../app/api/snapshots/[id]/route');
  await GET({} as any, { params: { id: SNAP_B_ID } });

  // The findFirst call must include workspaceId in WHERE
  expect(mockFindFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ workspaceId: WS_A_ID }),
    }),
  );
});

// ── TC-ISO-05: DELETE import — returns 404 for another workspace's record ──────

test('TC-ISO-05: DELETE /api/imports/[id] returns 404 when import belongs to another workspace', async () => {
  // findFirst returns null because the record's workspaceId is WS_B_ID, not WS_A_ID
  mockFindFirst.mockResolvedValueOnce(null);

  const { DELETE } = await import('../../app/api/imports/[id]/route');
  const res  = await DELETE({} as any, { params: { id: IMPORT_B_ID } });
  const body = await res.json();

  // Service returns 'not found' → route returns 404
  expect(res.status).toBe(404);
  expect(mockImportDelete).not.toHaveBeenCalled();
});

// ── TC-ISO-06: trends only returns User A's workspace records ──────────────────

test('TC-ISO-06: GET /api/trends only queries records scoped to the user workspace', async () => {
  mockFindMany.mockResolvedValueOnce([]);

  const { GET } = await import('../../app/api/trends/route');
  const req = { url: 'http://localhost/api/trends' } as any;
  await GET(req);

  expect(mockFindMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ workspaceId: WS_A_ID }),
    }),
  );
});
