// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Snapshot-load error-state tests — TC-SN-09 to TC-SN-11 (added 2026-06-08 to
// close TRACE-02 / Gaps Summary COVER-12 — see TODO-List.md Section 8): the
// GET /api/snapshots/:id route has three guarded error responses (401 not
// authenticated, 404 not found, 403 access denied) that had no direct test.

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
    dashboardSnapshot: { findUnique: jest.fn() },
  },
}));

function ctx(id: string) {
  return { params: { id } };
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
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue(null);
  const { GET } = await import('../../app/api/snapshots/[id]/route');

  const response = await GET({} as any, ctx('bad-id'));
  const body = await response.json();

  expect(response.status).toBe(404);
  expect(body.error).toBe('Snapshot not found.');
});

test('TC-SN-11: loading another user\'s snapshot returns 403 Access denied (admin bypasses)', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.dashboardSnapshot.findUnique as jest.Mock).mockResolvedValue({
    id: 'snap-001', userId: 'user-bbb', snapshotName: 'Other', createdAt: new Date(), metricsJson: '{}',
  });
  const { GET } = await import('../../app/api/snapshots/[id]/route');

  const denied = await GET({} as any, ctx('snap-001'));
  expect(denied.status).toBe(403);
  expect((await denied.json()).error).toBe('Access denied.');

  // Admins may load any user's snapshot
  mockSession.role = 'admin';
  const allowed = await GET({} as any, ctx('snap-001'));
  expect(allowed.status).toBe(200);
  expect((await allowed.json()).id).toBe('snap-001');
});
