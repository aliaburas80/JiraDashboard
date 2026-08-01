// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-04: GET /api/account/export — full self-service account data export.

export {};

const mockSession: Record<string, unknown> = { isLoggedIn: true, userId: 'user-1' };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));

const mockExportAccountData = jest.fn();
jest.mock('@/lib/accountLifecycle', () => ({
  exportAccountData: (...a: unknown[]) => mockExportAccountData(...a),
}));

const sampleExport = {
  exportedAt: '2026-08-02T00:00:00.000Z',
  profile: { id: 'user-1', name: 'Sam', email: 'sam@test.com' },
  consents: [],
  entitlement: null,
  workspace: null,
  importLogs: [],
  snapshots: [],
  currentMetrics: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
  mockExportAccountData.mockResolvedValue(sampleExport);
});

test('returns the full export as a downloadable JSON attachment for a logged-in user', async () => {
  const { GET } = await import('../../app/api/account/export/route');
  const res = await GET();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(res.headers.get('Content-Disposition')).toMatch(/attachment; filename="delivery-clarity-export-/);
  expect(body).toEqual(sampleExport);
  expect(mockExportAccountData).toHaveBeenCalledWith('user-1');
});

test('rejects an unauthenticated request with 401', async () => {
  mockSession.isLoggedIn = false;
  const { GET } = await import('../../app/api/account/export/route');
  const res = await GET();

  expect(res.status).toBe(401);
  expect(mockExportAccountData).not.toHaveBeenCalled();
});
