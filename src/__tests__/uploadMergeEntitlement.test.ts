// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-02: POST /api/upload/merge previously had zero trial-entitlement or
// email-verification gating — a consumed/expired/suspended non-admin user,
// or one who hadn't verified their email, could fully bypass both checks
// through this route while the single-file /api/upload route correctly
// enforced them. This file exercises the gates this route now shares with
// the single-file route.

export {};

const mockSession: Record<string, unknown> = { isLoggedIn: true, userId: 'user-1', emailVerified: true, role: 'user' };

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
  calculateDashboardMetrics: jest.fn(() => ({ totalIssues: 1, doneIssues: 1, healthScore: 100 })),
}));
jest.mock('@/lib/mergeIssues', () => ({
  mergeIssueArrays: jest.fn((arrays: unknown[][]) => ({ merged: arrays.flat(), stats: {} })),
}));

const mockEntitlementFindUnique = jest.fn();
const mockEntitlementUpdate     = jest.fn();
const mockEntitlementUpdateMany = jest.fn();
const mockImportLogCreate       = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    importLog: { create: (...a: unknown[]) => mockImportLogCreate(...a) },
    entitlement: {
      findUnique: (...a: unknown[]) => mockEntitlementFindUnique(...a),
      update:     (...a: unknown[]) => mockEntitlementUpdate(...a),
      updateMany: (...a: unknown[]) => mockEntitlementUpdateMany(...a),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        importLog:   { create: (...a: unknown[]) => mockImportLogCreate(...a) },
        entitlement: { update: (...a: unknown[]) => mockEntitlementUpdate(...a) },
      };
      return fn(tx);
    }),
  },
}));

function multipartRequest(files: File[]) {
  const form = new FormData();
  for (const file of files) form.append('file', file);
  return { formData: jest.fn(async () => form) } as any;
}

function csvFile(name: string) {
  return new File(['Issue key,Status\nA-1,Done\n'], name, { type: 'text/csv' });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn    = true;
  mockSession.emailVerified = true;
  mockSession.role          = 'user';
  mockEntitlementFindUnique.mockResolvedValue({
    id: 'ent-1', status: 'eligible', expiresAt: null, consumedAt: null, replacementUsedAt: null, updatedAt: new Date(),
  });
  mockEntitlementUpdate.mockResolvedValue({});
  mockEntitlementUpdateMany.mockResolvedValue({ count: 1 });
  mockImportLogCreate.mockResolvedValue({ id: 'il-1' });
});

test('eligible non-admin can merge and consumes the entitlement', async () => {
  const { POST } = await import('../../app/api/upload/merge/route');
  const res = await POST(multipartRequest([csvFile('a.csv'), csvFile('b.csv')]));

  expect(res.status).toBe(200);
  expect(mockImportLogCreate).toHaveBeenCalled();
  expect(mockEntitlementUpdate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ status: 'consumed' }),
  }));
});

test('consumed non-admin (outside replacement window) is blocked with 403', async () => {
  mockEntitlementFindUnique.mockResolvedValue({
    id: 'ent-1', status: 'consumed',
    consumedAt: new Date(Date.now() - 5 * 86_400_000),
    expiresAt:  new Date(Date.now() + 25 * 86_400_000),
    replacementUsedAt: null, updatedAt: new Date(),
  });
  const { POST } = await import('../../app/api/upload/merge/route');
  const res = await POST(multipartRequest([csvFile('a.csv'), csvFile('b.csv')]));

  expect(res.status).toBe(403);
  expect(mockImportLogCreate).not.toHaveBeenCalled();
});

test('admin bypasses entitlement entirely, even when consumed', async () => {
  mockSession.role = 'admin';
  mockEntitlementFindUnique.mockResolvedValue({
    id: 'ent-1', status: 'consumed',
    consumedAt: new Date(Date.now() - 5 * 86_400_000),
    expiresAt:  new Date(Date.now() + 25 * 86_400_000),
    replacementUsedAt: null, updatedAt: new Date(),
  });
  const { POST } = await import('../../app/api/upload/merge/route');
  const res = await POST(multipartRequest([csvFile('a.csv'), csvFile('b.csv')]));

  expect(res.status).toBe(200);
  expect(mockEntitlementFindUnique).not.toHaveBeenCalled();
});

test('unverified email is blocked with 403, same as the single-file route', async () => {
  mockSession.emailVerified = false;
  const { POST } = await import('../../app/api/upload/merge/route');
  const res = await POST(multipartRequest([csvFile('a.csv'), csvFile('b.csv')]));
  const body = await res.json();

  expect(res.status).toBe(403);
  expect(body.error).toMatch(/verify your email/i);
  expect(mockEntitlementFindUnique).not.toHaveBeenCalled();
});

test('a replacement upload within the 24h window is allowed and does not reset consumedAt/expiresAt', async () => {
  mockEntitlementFindUnique.mockResolvedValue({
    id: 'ent-1', status: 'consumed',
    consumedAt: new Date(Date.now() - 60_000),
    expiresAt:  new Date(Date.now() + 29 * 86_400_000),
    replacementUsedAt: null, updatedAt: new Date(),
  });
  const { POST } = await import('../../app/api/upload/merge/route');
  const res  = await POST(multipartRequest([csvFile('a.csv'), csvFile('b.csv')]));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.isReplacement).toBe(true);
  // Replacement lock via updateMany (replacementUsedAt), never status.
  expect(mockEntitlementUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ replacementUsedAt: expect.any(Date) }),
  }));
  // Consume via tx.entitlement.update must only set importLogId, never
  // consumedAt/expiresAt/status.
  const updateCall = mockEntitlementUpdate.mock.calls[0][0];
  expect(updateCall.data).not.toHaveProperty('consumedAt');
  expect(updateCall.data).not.toHaveProperty('expiresAt');
  expect(updateCall.data).not.toHaveProperty('status');
});
