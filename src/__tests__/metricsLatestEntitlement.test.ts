// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-02: GET /api/metrics/latest previously never checked entitlement at
// all — a consumed/expired user's dashboard kept working indefinitely,
// despite the master plan (§4.1) requiring the private workspace to be
// disabled after the 30-day trial expires. This is the one chokepoint every
// dashboard page funnels through via loadMetricsWithSource().

export {};

const mockSession: Record<string, unknown> = { isLoggedIn: true, userId: 'user-1', role: 'user' };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/workspace', () => ({
  getMetricsScopeKeyForUser: jest.fn(async () => 'user:user-1'),
}));
jest.mock('@/services/storage/userStorageProvider.service', () => ({
  getVerifiedUserStorageProviderInstance: jest.fn(async () => null),
}));
jest.mock('@/services/storage/cloudSync', () => ({
  syncFromCloud: jest.fn(async () => ({ status: 'offline', source: 'local' })),
}));

const mockReadLatestMetrics = jest.fn();
jest.mock('@/services/metrics/latestMetricsStorage', () => ({
  readLatestMetrics:  (...a: unknown[]) => mockReadLatestMetrics(...a),
  writeLatestMetrics: jest.fn(),
}));

const mockGetEntitlementForUser = jest.fn();
jest.mock('@/lib/entitlement', () => ({
  getEntitlementForUser: (...a: unknown[]) => mockGetEntitlementForUser(...a),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.role = 'user';
  mockReadLatestMetrics.mockReturnValue({ metrics: { totalIssues: 5 }, savedAt: new Date().toISOString() });
});

test('expired non-admin gets available:false with reason "expired", metrics never read', async () => {
  mockGetEntitlementForUser.mockResolvedValue({ status: 'expired', daysLeft: 0, consumedAt: new Date(), expiresAt: new Date(), replacementUsedAt: null });
  const { GET } = await import('../../app/api/metrics/latest/route');

  const res  = await GET();
  const body = await res.json();

  expect(body.available).toBe(false);
  expect(body.reason).toBe('expired');
  expect(mockReadLatestMetrics).not.toHaveBeenCalled();
});

test('consumed-but-active non-admin gets normal metrics data', async () => {
  mockGetEntitlementForUser.mockResolvedValue({
    status: 'consumed', daysLeft: 10, consumedAt: new Date(), expiresAt: new Date(Date.now() + 10 * 86_400_000), replacementUsedAt: null,
  });
  const { GET } = await import('../../app/api/metrics/latest/route');

  const res  = await GET();
  const body = await res.json();

  expect(body.available).toBe(true);
  expect(body.metrics).toEqual({ totalIssues: 5 });
});

test('admin bypasses the expiry check entirely, even when entitlement is expired', async () => {
  mockSession.role = 'admin';
  const { GET } = await import('../../app/api/metrics/latest/route');

  const res  = await GET();
  const body = await res.json();

  expect(body.available).toBe(true);
  expect(mockGetEntitlementForUser).not.toHaveBeenCalled();
});
