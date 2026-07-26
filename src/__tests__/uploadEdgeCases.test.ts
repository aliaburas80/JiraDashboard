// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /api/upload edge-case tests (P0A-02): file-size limit, empty CSV, and the
// new Issue-Key dedup fix. Companion to uploadUserId.test.ts, which covers
// the auth/session and file-signature paths — these three were the real
// gaps identified in the P0-A gate Phase 2 audit.

export {};

const mockSession: { isLoggedIn: boolean; userId: string | null } = {
  isLoggedIn: true,
  userId: 'user-1',
};

const minimalMetrics = {
  totalIssues: 1,
  doneIssues: 1,
  healthScore: 90,
  completionRate: 1,
  blockedIssues: 0,
  openDefects: 0,
  activeIssues: 0,
  flow: { critical: 0, warning: 0, averageLeadTimeDays: 1, averageCycleTimeDays: 1, itemsCapped: false },
  dataQuality: { score: 90 },
  throughput: { sprint: { averageThroughputCount: 1, trendDirection: 'stable' } },
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
// Real validateIssueData is used (not mocked) so the empty-CSV test exercises
// the actual 422 branch end-to-end, not a stubbed response.
jest.mock('@/services/metrics/metrics.service', () => ({
  calculateDashboardMetrics: jest.fn(() => minimalMetrics),
}));
jest.mock('@/services/imports/importLogs.service', () => ({
  appendImportLog: jest.fn((log: unknown) => log),
  buildImportLog: jest.fn((input: unknown) => input),
}));
jest.mock('@/lib/releaseConfidence', () => ({
  computeReleaseConfidence: jest.fn(() => 75),
}));
jest.mock('@/services/metrics/latestMetricsStorage', () => ({
  writeLatestMetrics: jest.fn(),
}));
jest.mock('@/services/storage/cloudSync', () => ({
  pushToCloud: jest.fn(async () => ({ status: 'pushed' })),
  markPendingPush: jest.fn(),
}));
jest.mock('@/services/storage/userStorageProvider.service', () => ({
  getUserStorageProviderStatus: jest.fn(async () => 'none'),
  getVerifiedUserStorageProviderInstance: jest.fn(async () => null),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    importLog:    { create: jest.fn(async () => ({ id: 'il-1' })) },
    loginAttempt: {
      findMany:   jest.fn(async () => []),
      create:     jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    entitlement: {
      findUnique:  jest.fn(async () => ({ id: 'ent-1', status: 'eligible', expiresAt: null, consumedAt: null, updatedAt: new Date() })),
      update:      jest.fn(async () => ({})),
      updateMany:  jest.fn(async () => ({ count: 1 })),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        importLog:   { create: jest.fn(async () => ({ id: 'il-tx-1' })) },
        entitlement: { update: jest.fn(async () => ({})) },
      };
      return fn(tx);
    }),
  },
}));

function request(file: unknown) {
  return {
    headers: { get: jest.fn(() => null) },
    formData: jest.fn(async () => ({ get: jest.fn(() => file) })),
  } as any;
}

function blobFile(name = 'export.csv', content = 'Issue Key,Issue Type,Summary,Status\nPROJ-1,Story,Test,Done\n', sizeOverride?: number) {
  const buf = Buffer.from(content, 'utf8');
  const f = {
    name,
    size: sizeOverride ?? buf.byteLength,
    arrayBuffer: jest.fn(async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)),
  };
  Object.setPrototypeOf(f, Blob.prototype);
  return f;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
});

test('TC-UP-01: a file over MAX_UPLOAD_MB is rejected with 413 before parsing', async () => {
  jest.doMock('@/services/jira/parser', () => ({ parseJiraFile: jest.fn() }));
  const { POST } = await import('../../app/api/upload/route');

  // Size check reads file.size directly, ahead of arrayBuffer()/parsing — no
  // need to actually allocate a 20MB+ buffer to exercise this branch.
  const oversized = blobFile('export.csv', 'irrelevant', 21 * 1024 * 1024);
  const response = await POST(request(oversized));
  const body = await response.json();

  expect(response.status).toBe(413);
  expect(body.error).toMatch(/size limit/i);
  const { parseJiraFile } = jest.requireMock('@/services/jira/parser');
  expect(parseJiraFile).not.toHaveBeenCalled();
});

test('TC-UP-02: a CSV with zero issue rows fails validation with a 422, not a crash', async () => {
  jest.doMock('@/services/jira/parser', () => ({
    parseJiraFile: jest.fn(() => ({ issues: [], warnings: [], columnMapping: {} })),
  }));
  const { POST } = await import('../../app/api/upload/route');

  const response = await POST(request(blobFile()));
  const body = await response.json();

  expect(response.status).toBe(422);
  expect(body.details).toContain('Uploaded file contains no issue rows.');
});

test('TC-UP-03: a duplicate Issue Key row is merged, not double-counted, and surfaced as a warning', async () => {
  const duplicated = [
    { 'Issue Key': 'PROJ-1', 'Issue Type': 'Story', Summary: 'Test', Status: 'Done' },
    { 'Issue Key': 'PROJ-1', 'Issue Type': 'Story', Summary: 'Test (more detail)', Status: 'Done' },
  ];
  jest.doMock('@/services/jira/parser', () => ({
    parseJiraFile: jest.fn(() => ({ issues: duplicated, warnings: [], columnMapping: {} })),
    ESSENTIAL_FIELDS: ['Issue Key', 'Issue Type', 'Summary', 'Status'],
  }));
  const { calculateDashboardMetrics } = jest.requireMock('@/services/metrics/metrics.service');
  const { POST } = await import('../../app/api/upload/route');

  const response = await POST(request(blobFile()));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(calculateDashboardMetrics).toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ 'Issue Key': 'PROJ-1' })]),
  );
  expect((calculateDashboardMetrics as jest.Mock).mock.calls[0][0]).toHaveLength(1);
  expect(body.warnings).toContain('1 duplicate Issue Key row(s) were merged.');
});
