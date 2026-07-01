// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Upload-route session/userId persistence tests — TC-A-14 (added 2026-06-08 to
// close TRACE-02 / Gaps Summary COVER-11 — see TODO-List.md Section 8 /
// product/TEST_CASES.md §F3): a logged-in user's upload MUST be saved to the
// ImportLog table tagged with their userId; an anonymous upload MUST NOT.

export {};

const mockSession: { isLoggedIn: boolean; userId: string | null } = {
  isLoggedIn: true,
  userId: 'user-1',
};

const minimalMetrics = {
  totalIssues: 10,
  doneIssues: 5,
  healthScore: 80,
  completionRate: 0.5,
  blockedIssues: 0,
  openDefects: 0,
  activeIssues: 5,
  flow: { critical: 0, warning: 0, averageLeadTimeDays: 1, averageCycleTimeDays: 1, itemsCapped: false },
  dataQuality: { score: 90 },
  throughput: { sprint: { averageThroughputCount: 1, trendDirection: 'stable' } },
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/services/jira/parser', () => ({
  parseJiraFile: jest.fn(() => ({ issues: [{ 'Issue Key': 'PROJ-1' }], warnings: [], columnMapping: {} })),
}));
jest.mock('@/services/jira/validation', () => ({
  validateIssueData: jest.fn(() => ({ isValid: true, errors: [] })),
}));
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
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    importLog:    { create: jest.fn(async () => ({})) },
    loginAttempt: {
      findMany:   jest.fn(async () => []),
      create:     jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
  },
}));

function request(file: unknown) {
  return {
    headers: { get: jest.fn(() => null) },
    formData: jest.fn(async () => ({ get: jest.fn(() => file) })),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
});

// The route checks `file instanceof Blob` — give our fake file object that prototype.
function blobFile(name = 'export.csv', size = 1024) {
  const f = {
    name,
    size,
    arrayBuffer: jest.fn(async () => new ArrayBuffer(size)),
  };
  Object.setPrototypeOf(f, Blob.prototype);
  return f;
}

test('TC-A-14a: upload while logged in persists an ImportLog row tagged with the session userId', async () => {
  const { prisma } = await import('@/lib/prisma');
  const { POST } = await import('../../app/api/upload/route');

  const response = await POST(request(blobFile()));
  expect(response.status).toBe(200);

  expect(prisma.importLog.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ userId: 'user-1', fileName: 'export.csv' }),
  }));
});

// P0A-04 (2026-07-01): anonymous upload is now rejected with 401 — the upload
// route previously allowed unauthenticated submissions ("optional auth"). This
// was a data-isolation vulnerability: anyone could overwrite the shared metrics
// file. The test is updated to assert the new correct behaviour.
test('TC-A-14b: anonymous upload (no session) is rejected with 401', async () => {
  mockSession.isLoggedIn = false;
  mockSession.userId = null;
  const { prisma } = await import('@/lib/prisma');
  const { POST } = await import('../../app/api/upload/route');

  const response = await POST(request(blobFile()));
  expect(response.status).toBe(401);

  expect(prisma.importLog.create).not.toHaveBeenCalled();
});
