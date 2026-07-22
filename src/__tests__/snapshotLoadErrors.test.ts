// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Snapshot-load error-state tests — TC-SN-09 to TC-SN-11 (added 2026-06-08 to
// close TRACE-02 / Gaps Summary COVER-12 — see TODO-List.md Section 8): the
// GET /api/snapshots/:id route guards for 401, 404, and cross-workspace access.
// EP-008 note: TC-SN-11 updated — non-admin cross-workspace access now returns 404
// (not 403) to prevent IDOR information leakage. Admin still bypasses scope.

export {};

const mockSession: { isLoggedIn: boolean; userId: string; role: string } = {
  isLoggedIn: true,
  userId: 'user-aaa',
  role: 'scrum_master',
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    // EP-008: route uses findFirst (workspace-scoped) for non-admin, findUnique for admin
    dashboardSnapshot: { findUnique: jest.fn(), findFirst: jest.fn() },
  },
}));
jest.mock('@/lib/workspace', () => ({
  getWorkspaceForUser: jest.fn(async () => ({ id: 'ws-aaa', name: 'Alice WS', slug: 'ws-aaa', status: 'active' })),
}));

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-aaa';
  mockSession.role = 'scrum_master';
});

test('TC-SN-09: loading a snapshot while unauthenticated returns 401 Not authenticated', async () => {
  mockSession.isLoggedIn = false;
  const { GET } = await import('../../app/api/snapshots/[id]/route');

  const response = await GET({} as any, ctx('snap-001'));
  const body = await response.json();

  expect(response.status).toBe(401);
  expect(body.error).toBe('Not authenticated.');
});

test('TC-SN-10: loading a non-existent snapshot returns 404 Snapshot not found', async () => {
  const { prisma } = await import('@/lib/prisma');
  // Non-admin uses findFirst (workspace-scoped); null means not found or wrong workspace
  (prisma.dashboardSnapshot.findFirst as jest.Mock).mockResolvedValue(null);
  const { GET } = await import('../../app/api/snapshots/[id]/route');

  const response = await GET({} as any, ctx('bad-id'));
  const body = await response.json();

  expect(response.status).toBe(404);
  expect(body.error).toBe('Snapshot not found.');
});

test('TC-SN-11: loading another workspace\'s snapshot returns 404 (EP-008 IDOR fix — admin bypasses)', async () => {
  // EP-008: non-admin gets 404 (not 403) for cross-workspace access — no existence leakage.
  // The findFirst scope query returns null when the snapshot is in another workspace.
  const { prisma } = await import('@/lib/prisma');
  (prisma.dashboardSnapshot.findFirst as jest.Mock).mockResolvedValue(null); // workspace mismatch
  const { GET } = await import('../../app/api/snapshots/[id]/route');

  const denied = await GET({} as any, ctx('snap-other-ws'));
  expect(denied.status).toBe(404); // fail-closed: no existence leakage
  expect((await denied.json()).error).toBe('Snapshot not found.');

  // Admins bypass workspace scope and use findUnique directly
  mockSession.role = 'admin';
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue({
    id: 'snap-001', userId: 'user-bbb', snapshotName: 'Other', createdAt: new Date(), metricsJson: '{}',
  });
  const allowed = await GET({} as any, ctx('snap-001'));
  expect(allowed.status).toBe(200);
  expect((await allowed.json()).id).toBe('snap-001');
});
