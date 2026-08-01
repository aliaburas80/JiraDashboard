// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-04: src/lib/accountLifecycle.ts — self-service account deletion
// request/cancel and full-account export.

export {};

const mockUserUpdate         = jest.fn();
const mockUserFindUniqueThrow = jest.fn();
const mockConsentFindMany    = jest.fn();
const mockEntitlementFindUnique = jest.fn();
const mockWorkspaceFindFirst = jest.fn();
const mockImportLogFindMany  = jest.fn();
const mockSnapshotFindMany   = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user:              { update: (...a: unknown[]) => mockUserUpdate(...a), findUniqueOrThrow: (...a: unknown[]) => mockUserFindUniqueThrow(...a) },
    consent:           { findMany: (...a: unknown[]) => mockConsentFindMany(...a) },
    entitlement:       { findUnique: (...a: unknown[]) => mockEntitlementFindUnique(...a) },
    workspace:         { findFirst: (...a: unknown[]) => mockWorkspaceFindFirst(...a) },
    importLog:         { findMany: (...a: unknown[]) => mockImportLogFindMany(...a) },
    dashboardSnapshot: { findMany: (...a: unknown[]) => mockSnapshotFindMany(...a) },
  },
}));
jest.mock('@/lib/workspace', () => ({
  getMetricsScopeKeyForUser: jest.fn(async () => 'user:user-1'),
}));
const mockReadLatestMetrics = jest.fn();
jest.mock('@/services/metrics/latestMetricsStorage', () => ({
  readLatestMetrics: (...a: unknown[]) => mockReadLatestMetrics(...a),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUserUpdate.mockResolvedValue({});
  mockUserFindUniqueThrow.mockResolvedValue({
    id: 'user-1', name: 'Sam', email: 'sam@test.com', role: 'user', persona: 'Scrum Master',
    secondaryPersonas: [], dataStorageMode: 'cloud', emailVerified: true,
    createdAt: new Date('2026-01-01'), termsAcceptedAt: new Date('2026-01-01'), termsVersion: 'v1',
  });
  mockConsentFindMany.mockResolvedValue([]);
  mockEntitlementFindUnique.mockResolvedValue(null);
  mockWorkspaceFindFirst.mockResolvedValue(null);
  mockImportLogFindMany.mockResolvedValue([]);
  mockSnapshotFindMany.mockResolvedValue([]);
  mockReadLatestMetrics.mockReturnValue(null);
});

test('requestAccountDeletion deactivates the account and sets deletionRequestedAt', async () => {
  const { requestAccountDeletion } = await import('@/lib/accountLifecycle');
  await requestAccountDeletion('user-1');

  expect(mockUserUpdate).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data:  { isActive: false, deletionRequestedAt: expect.any(Date) },
  });
});

test('cancelAccountDeletion clears deletionRequestedAt', async () => {
  const { cancelAccountDeletion } = await import('@/lib/accountLifecycle');
  await cancelAccountDeletion('user-1');

  expect(mockUserUpdate).toHaveBeenCalledWith({
    where: { id: 'user-1' },
    data:  { deletionRequestedAt: null },
  });
});

describe('exportAccountData', () => {
  test('never includes passwordHash or any token field', async () => {
    const { exportAccountData } = await import('@/lib/accountLifecycle');
    const result = await exportAccountData('user-1');

    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/passwordHash/i);
    expect(serialized).not.toMatch(/Token/);
    expect(mockUserFindUniqueThrow).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.not.objectContaining({ passwordHash: true }),
    }));
  });

  test('includes profile, consents, entitlement, workspace, imports, snapshots, and current metrics', async () => {
    mockConsentFindMany.mockResolvedValue([{ purpose: 'terms_and_privacy', granted: true, version: 'v1', source: 'registration', createdAt: new Date('2026-01-01') }]);
    mockEntitlementFindUnique.mockResolvedValue({ status: 'eligible', consumedAt: null, expiresAt: null });
    mockWorkspaceFindFirst.mockResolvedValue({ id: 'ws-1', name: 'Sam', slug: 'ws-user-1' });
    mockImportLogFindMany.mockResolvedValue([{ id: 'il-1', fileName: 'export.csv', status: 'success', totalIssues: 10, healthScore: 90, uploadedAt: new Date('2026-02-01') }]);
    mockSnapshotFindMany.mockResolvedValue([{ id: 'snap-1', snapshotName: 'Q1', metricsJson: '{}', createdAt: new Date('2026-03-01') }]);
    mockReadLatestMetrics.mockReturnValue({ savedAt: '2026-04-01', metrics: { totalIssues: 5 }, origin: null });

    const { exportAccountData } = await import('@/lib/accountLifecycle');
    const result = await exportAccountData('user-1');

    expect(result.profile.email).toBe('sam@test.com');
    expect(result.consents).toHaveLength(1);
    expect(result.entitlement?.status).toBe('eligible');
    expect(result.workspace?.id).toBe('ws-1');
    expect(result.importLogs).toHaveLength(1);
    expect(result.snapshots).toHaveLength(1);
    expect(result.currentMetrics).toEqual({ totalIssues: 5 });
    expect(typeof result.exportedAt).toBe('string');
  });

  test('returns null entitlement/workspace/currentMetrics when none exist, rather than throwing', async () => {
    const { exportAccountData } = await import('@/lib/accountLifecycle');
    const result = await exportAccountData('user-1');

    expect(result.entitlement).toBeNull();
    expect(result.workspace).toBeNull();
    expect(result.currentMetrics).toBeNull();
  });
});
