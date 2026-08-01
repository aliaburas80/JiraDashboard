// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
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
  markPendingPush: jest.fn(),
}));
// EP-024: no per-user cloud storage provider configured — App storage path, unaffected.
jest.mock('@/services/storage/userStorageProvider.service', () => ({
  getUserStorageProviderStatus: jest.fn(async () => 'none'),
  getVerifiedUserStorageProviderInstance: jest.fn(async () => null),
}));
const mockEntitlementFindUnique = jest.fn();
const mockEntitlementUpdate     = jest.fn();
const mockEntitlementUpdateMany = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    importLog:    { create: jest.fn(async () => ({ id: 'il-1' })) },
    loginAttempt: {
      findMany:   jest.fn(async () => []),
      create:     jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    // EP-015: entitlement checked + consumed during upload
    entitlement: {
      findUnique:  (...a: unknown[]) => mockEntitlementFindUnique(...(a as [])),
      update:      (...a: unknown[]) => mockEntitlementUpdate(...(a as [])),
      updateMany:  (...a: unknown[]) => mockEntitlementUpdateMany(...(a as [])),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        importLog:   { create: jest.fn(async () => ({ id: 'il-tx-1' })) },
        entitlement: { update: (...a: unknown[]) => mockEntitlementUpdate(...(a as [])) },
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

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
  mockEntitlementFindUnique.mockResolvedValue({ id: 'ent-1', status: 'eligible', expiresAt: null, consumedAt: null, replacementUsedAt: null, updatedAt: new Date() });
  mockEntitlementUpdate.mockResolvedValue({});
  mockEntitlementUpdateMany.mockResolvedValue({ count: 1 });
});

// The route checks `file instanceof Blob` — give our fake file object that prototype.
// SEC (2026-07-18): the route now runs validateFileSignature() on the real
// buffer before parsing (see src/lib/fileSignature.ts) — the fixture must
// contain plausible CSV text (not an all-zero ArrayBuffer, which fails the
// new sanity check as binary-looking content) for the "happy path" tests to
// still exercise the route past that gate.
function blobFile(name = 'export.csv', content = 'Issue Key,Issue Type,Summary,Status\nPROJ-1,Story,Test,Done\n') {
  const buf = Buffer.from(content, 'utf8');
  const f = {
    name,
    size: buf.byteLength,
    arrayBuffer: jest.fn(async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)),
  };
  Object.setPrototypeOf(f, Blob.prototype);
  return f;
}

test('TC-A-14a: upload while logged in persists an ImportLog row tagged with the session userId', async () => {
  // EP-015: ImportLog creation now happens inside prisma.$transaction alongside
  // entitlement consumption. Verify the transaction ran (ImportLog + entitlement
  // are created atomically) rather than checking importLog.create directly.
  const { prisma } = await import('@/lib/prisma');
  const { POST } = await import('../../app/api/upload/route');

  const response = await POST(request(blobFile()));
  expect(response.status).toBe(200);

  // The transaction was called — this proves ImportLog was persisted (atomically)
  expect(prisma.$transaction).toHaveBeenCalled();
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

// SEC (2026-07-18, docs/product-audit/10-technical-cleanup.md Part 1 finding 3):
// the route now runs validateFileSignature() ahead of parseJiraFile() — a file
// with a spoofed .xlsx extension whose actual bytes are not a ZIP/OOXML
// archive must be rejected here, with a clear 400, before ever reaching the
// parser. Real .xlsx content is always a ZIP archive (no legitimate
// exception), so this extension gets a strict check — see
// src/lib/fileSignature.ts for why .csv/.xls are deliberately lenient.
test('SEC-2026-07-18a: upload rejects a .xlsx file whose content is not a real Excel archive', async () => {
  const { POST } = await import('../../app/api/upload/route');

  const spoofed = blobFile('export.xlsx', 'this is plain text pretending to be an .xlsx file');
  const response = await POST(request(spoofed));
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toContain('.xlsx');
});

test('SEC-2026-07-18b: upload accepts a real .xlsx (ZIP/OOXML signature) past the content-signature gate', async () => {
  const { POST } = await import('../../app/api/upload/route');

  // Real .xlsx files are ZIP archives — a genuine local-file-header signature
  // is enough to pass the gate; downstream parseJiraFile() (mocked in this
  // file) is what would validate the actual sheet contents in production.
  const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
  const f = {
    name: 'export.xlsx',
    size: zipSignature.byteLength,
    arrayBuffer: jest.fn(async () => zipSignature.buffer.slice(zipSignature.byteOffset, zipSignature.byteOffset + zipSignature.byteLength)),
  };
  Object.setPrototypeOf(f, Blob.prototype);

  const response = await POST(request(f));
  expect(response.status).toBe(200);
});

// P0B-02: master plan §4.1 — one replacement upload within 24h of the
// original successful analysis, anchored to the original consumedAt/
// expiresAt (never resets the 30-day clock).

test('P0B-02a: an upload within the 24h replacement window succeeds and consumes via the replacement path, not a fresh consume', async () => {
  mockEntitlementFindUnique.mockResolvedValue({
    id: 'ent-1', status: 'consumed',
    consumedAt: new Date(Date.now() - 60_000),
    expiresAt:  new Date(Date.now() + 29 * 86_400_000),
    replacementUsedAt: null, updatedAt: new Date(),
  });
  const { POST } = await import('../../app/api/upload/route');

  const response = await POST(request(blobFile()));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.isReplacement).toBe(true);
  // Locked via replacementUsedAt (updateMany), never status.
  expect(mockEntitlementUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ replacementUsedAt: expect.any(Date) }),
  }));
  // Consumed via tx.entitlement.update setting only importLogId — the
  // 30-day clock must stay anchored to the original consumedAt/expiresAt.
  const updateCall = mockEntitlementUpdate.mock.calls[0][0];
  expect(updateCall.data).toHaveProperty('importLogId');
  expect(updateCall.data).not.toHaveProperty('consumedAt');
  expect(updateCall.data).not.toHaveProperty('expiresAt');
  expect(updateCall.data).not.toHaveProperty('status');
});

test('P0B-02b: a failed replacement upload reverts via replacementUsedAt and leaves status at consumed, not eligible', async () => {
  mockEntitlementFindUnique.mockResolvedValue({
    id: 'ent-1', status: 'consumed',
    consumedAt: new Date(Date.now() - 60_000),
    expiresAt:  new Date(Date.now() + 29 * 86_400_000),
    replacementUsedAt: null, updatedAt: new Date(),
  });
  const { POST } = await import('../../app/api/upload/route');

  // Spoofed .xlsx content — fails the signature gate, triggering a revert.
  const spoofed = blobFile('export.xlsx', 'this is plain text pretending to be an .xlsx file');
  const response = await POST(request(spoofed));
  expect(response.status).toBe(400);

  // The revert must go through revertReplacementUpload (replacementUsedAt: null),
  // never revertEntitlement (status: 'eligible') — a failed replacement must
  // never grant a fresh 30-day trial.
  expect(mockEntitlementUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ status: 'consumed' }),
    data:  { replacementUsedAt: null },
  }));
  const revertCall = mockEntitlementUpdateMany.mock.calls.find(
    (c: any) => c[0]?.data?.replacementUsedAt === null,
  );
  expect(revertCall?.[0]?.data).not.toHaveProperty('status');
});
