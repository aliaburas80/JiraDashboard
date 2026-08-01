// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/upload/merge content-signature gate tests — leftover scope from
// SEC (2026-07-18, docs/product-audit/10-technical-cleanup.md Part 1 finding
// 3): the single-file /api/upload route got this gate, this route did not.

export {};

const mockSession = { isLoggedIn: true, userId: 'user-1' };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/services/storage/userStorageProvider.service', () => ({
  getUserStorageProviderStatus: jest.fn(async () => 'none'),
  getVerifiedUserStorageProviderInstance: jest.fn(async () => null),
}));
jest.mock('@/lib/workspace', () => ({
  getWorkspaceForUser: jest.fn(async () => null),
}));
// P0B-02: this route now goes through the same trial-entitlement gate as
// the single-file upload route — mock at the prisma boundary (not
// @/lib/entitlement) so the real state-machine logic still runs, matching
// the pattern already used by uploadEdgeCases.test.ts/uploadUserId.test.ts.
jest.mock('@/lib/prisma', () => ({
  prisma: {
    importLog: { create: jest.fn(async () => ({ id: 'il-1' })) },
    entitlement: {
      findUnique: jest.fn(async () => ({ id: 'ent-1', status: 'eligible', expiresAt: null, consumedAt: null, replacementUsedAt: null, updatedAt: new Date() })),
      update:     jest.fn(async () => ({})),
      updateMany: jest.fn(async () => ({ count: 1 })),
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
jest.mock('@/services/metrics/latestMetricsStorage', () => ({
  writeLatestMetrics: jest.fn(),
}));
jest.mock('@/services/storage/cloudSync', () => ({
  markPendingPush: jest.fn(),
  pushToCloud: jest.fn(async () => {}),
}));
jest.mock('@/services/jira/parser', () => ({
  parseJiraFile: jest.fn(() => ({ issues: [{ key: 'A-1' }], warnings: [] })),
}));
jest.mock('@/services/jira/validation', () => ({
  validateIssueData: jest.fn(() => ({ isValid: true, errors: [] })),
}));
jest.mock('@/services/metrics/metrics.service', () => ({
  calculateDashboardMetrics: jest.fn(() => ({ totalIssues: 1 })),
}));
jest.mock('@/lib/mergeIssues', () => ({
  mergeIssueArrays: jest.fn((arrays: unknown[][]) => ({ merged: arrays.flat(), stats: {} })),
}));

function multipartRequest(files: File[]) {
  const form = new FormData();
  for (const file of files) form.append('file', file);
  return { formData: jest.fn(async () => form) } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
});

test('SEC-tail: upload/merge rejects a .csv file whose content is binary garbage, not text', async () => {
  const { parseJiraFile } = await import('@/services/jira/parser');
  const { POST } = await import('../../app/api/upload/merge/route');

  const binary = new Uint8Array(Array.from({ length: 200 }, (_, i) => (i * 37) % 256).filter((b) => b !== 0));
  const response = await POST(multipartRequest([new File([binary], 'export.csv', { type: 'text/csv' })]));
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toContain('export.csv');
  expect(parseJiraFile).not.toHaveBeenCalled();
});

test('upload/merge rejects a spoofed .xlsx (content is plain text, not a ZIP/OOXML archive)', async () => {
  const { parseJiraFile } = await import('@/services/jira/parser');
  const { POST } = await import('../../app/api/upload/merge/route');

  const response = await POST(
    multipartRequest([new File(['not really an xlsx'], 'export.xlsx', { type: 'application/octet-stream' })]),
  );
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toContain('export.xlsx');
  expect(parseJiraFile).not.toHaveBeenCalled();
});

test('upload/merge still accepts real text-content files past the content-signature gate', async () => {
  const { POST } = await import('../../app/api/upload/merge/route');

  const csv = 'Issue key,Status\nA-1,Done\n';
  const response = await POST(
    multipartRequest([new File([csv], 'a.csv', { type: 'text/csv' }), new File([csv], 'b.csv', { type: 'text/csv' })]),
  );

  expect(response.status).toBe(200);
});

test('upload/merge names the offending file when only one of several files fails the signature check', async () => {
  const { POST } = await import('../../app/api/upload/merge/route');

  const csv = 'Issue key,Status\nA-1,Done\n';
  const binary = new Uint8Array(Array.from({ length: 200 }, (_, i) => (i * 37) % 256).filter((b) => b !== 0));
  const response = await POST(
    multipartRequest([
      new File([csv], 'good.csv', { type: 'text/csv' }),
      new File([binary], 'bad.csv', { type: 'text/csv' }),
    ]),
  );
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body.error).toContain('bad.csv');
});
