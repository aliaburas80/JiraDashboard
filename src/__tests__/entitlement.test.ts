// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-015: Entitlement state machine tests — TC-ENT-01 to TC-ENT-10

export {};

const mockFindUnique   = jest.fn();
const mockUpdateMany   = jest.fn();
const mockUpdate       = jest.fn();
const mockCreate       = jest.fn();
const mockTransaction  = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    entitlement: {
      findUnique:  (...a: unknown[]) => mockFindUnique(...a),
      update:      (...a: unknown[]) => mockUpdate(...a),
      updateMany:  (...a: unknown[]) => mockUpdateMany(...a),
      create:      (...a: unknown[]) => mockCreate(...a),
    },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));

import {
  getEntitlementForUser,
  checkUploadEntitlement,
  beginUploadEntitlement,
  revertEntitlement,
  beginReplacementUpload,
  revertReplacementUpload,
  consumeReplacementUpload,
  consumeEntitlement,
  createEntitlementForUser,
  restoreEntitlement,
} from '../lib/entitlement';

beforeEach(() => jest.clearAllMocks());

// ── TC-ENT-01: eligible user is allowed to upload ─────────────────────────────

test('TC-ENT-01: checkUploadEntitlement returns allowed=true for eligible user', async () => {
  mockFindUnique.mockResolvedValueOnce({ status: 'eligible', expiresAt: null, consumedAt: null, updatedAt: new Date() });
  const result = await checkUploadEntitlement('user-1', false);
  expect(result.allowed).toBe(true);
});

// ── TC-ENT-02: consumed user is blocked ───────────────────────────────────────

test('TC-ENT-02: checkUploadEntitlement returns allowed=false for consumed user within window', async () => {
  const expiresAt  = new Date(Date.now() + 10 * 86_400_000); // 10 days remaining
  // 5 days ago — well outside the 24h replacement window (P0B-02), so this
  // exercises the plain "already consumed" block, not a replacement.
  const consumedAt = new Date(Date.now() - 5 * 86_400_000);
  mockFindUnique.mockResolvedValueOnce({ status: 'consumed', expiresAt, consumedAt, replacementUsedAt: null, updatedAt: new Date() });
  const result = await checkUploadEntitlement('user-2', false);
  expect(result.allowed).toBe(false);
  if (!result.allowed) expect(result.reason).toBe('consumed');
});

// ── TC-ENT-03: expired user is blocked ───────────────────────────────────────

test('TC-ENT-03: checkUploadEntitlement returns allowed=false for expired user', async () => {
  mockFindUnique.mockResolvedValueOnce({ status: 'expired', expiresAt: new Date(Date.now() - 1000), consumedAt: new Date(), updatedAt: new Date() });
  const result = await checkUploadEntitlement('user-3', false);
  expect(result.allowed).toBe(false);
  if (!result.allowed) expect(result.reason).toBe('expired');
});

// ── TC-ENT-04: suspended user is blocked ─────────────────────────────────────

test('TC-ENT-04: checkUploadEntitlement returns allowed=false for suspended user', async () => {
  mockFindUnique.mockResolvedValueOnce({ status: 'suspended', expiresAt: null, consumedAt: null, updatedAt: new Date() });
  const result = await checkUploadEntitlement('user-4', false);
  expect(result.allowed).toBe(false);
  if (!result.allowed) expect(result.reason).toBe('suspended');
});

// ── TC-ENT-05: admin always bypasses entitlement ─────────────────────────────

test('TC-ENT-05: checkUploadEntitlement returns allowed=true for admin regardless of status', async () => {
  // mockFindUnique NOT called for admins
  const result = await checkUploadEntitlement('admin-1', true);
  expect(result.allowed).toBe(true);
  expect(mockFindUnique).not.toHaveBeenCalled();
});

// ── TC-ENT-06: consumed + expired window → lazily marks expired ───────────────

test('TC-ENT-06: getEntitlementForUser lazily expires a consumed entitlement whose window has passed', async () => {
  const pastExpiry = new Date(Date.now() - 1000); // already expired
  mockFindUnique.mockResolvedValueOnce({
    id: 'ent-1', status: 'consumed', expiresAt: pastExpiry, consumedAt: new Date(Date.now() - 31 * 86_400_000), updatedAt: new Date(),
  });
  mockUpdate.mockResolvedValueOnce({ status: 'expired' });

  const result = await getEntitlementForUser('user-5');
  expect(result?.status).toBe('expired');
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ status: 'expired' }) }),
  );
});

// ── TC-ENT-07: beginUploadEntitlement sets status to processing ───────────────

test('TC-ENT-07: beginUploadEntitlement updates status to processing and returns true', async () => {
  mockUpdateMany.mockResolvedValueOnce({ count: 1 });
  const result = await beginUploadEntitlement('user-6');
  expect(result).toBe(true);
  expect(mockUpdateMany).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ status: 'processing' }) }),
  );
});

// ── TC-ENT-08: beginUploadEntitlement returns false if not eligible ───────────

test('TC-ENT-08: beginUploadEntitlement returns false when entitlement is not eligible', async () => {
  mockUpdateMany.mockResolvedValueOnce({ count: 0 }); // consumed/expired — no rows updated
  const result = await beginUploadEntitlement('user-7');
  expect(result).toBe(false);
});

// ── TC-ENT-09: revertEntitlement restores eligible on upload failure ──────────

test('TC-ENT-09: revertEntitlement sets status back to eligible on processing row', async () => {
  mockUpdateMany.mockResolvedValueOnce({ count: 1 });
  await revertEntitlement('user-8');
  expect(mockUpdateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ status: 'processing' }),
      data:  expect.objectContaining({ status: 'eligible' }),
    }),
  );
});

// ── TC-ENT-10: processing stuck >10min is auto-recovered to eligible ──────────

test('TC-ENT-10: getEntitlementForUser recovers a stuck processing state older than 10 minutes', async () => {
  const stuckTime = new Date(Date.now() - 15 * 60_000); // 15 min ago
  mockFindUnique.mockResolvedValueOnce({
    id: 'ent-stuck', status: 'processing', expiresAt: null, consumedAt: null, updatedAt: stuckTime,
  });
  mockUpdate.mockResolvedValueOnce({ status: 'eligible' });

  const result = await getEntitlementForUser('user-stuck');
  expect(result?.status).toBe('eligible');
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ status: 'eligible' }) }),
  );
});

// ── P0B-02: replacement upload (master plan §4.1 — one replacement within 24h) ─

test('TC-ENT-11: checkUploadEntitlement allows a replacement within the 24h window with no prior replacement', async () => {
  const consumedAt = new Date(Date.now() - 60_000); // 1 minute ago
  const expiresAt  = new Date(Date.now() + 29 * 86_400_000);
  mockFindUnique.mockResolvedValueOnce({ status: 'consumed', expiresAt, consumedAt, replacementUsedAt: null, updatedAt: new Date() });
  const result = await checkUploadEntitlement('user-9', false);
  expect(result.allowed).toBe(true);
  expect(result.isReplacement).toBe(true);
});

test('TC-ENT-12: checkUploadEntitlement blocks a replacement attempt past the 24h window', async () => {
  const consumedAt = new Date(Date.now() - 25 * 3600_000); // 25 hours ago
  const expiresAt  = new Date(Date.now() + 29 * 86_400_000);
  mockFindUnique.mockResolvedValueOnce({ status: 'consumed', expiresAt, consumedAt, replacementUsedAt: null, updatedAt: new Date() });
  const result = await checkUploadEntitlement('user-10', false);
  expect(result.allowed).toBe(false);
  if (!result.allowed) expect(result.reason).toBe('consumed');
});

test('TC-ENT-13: checkUploadEntitlement blocks a second replacement attempt once already used', async () => {
  const consumedAt        = new Date(Date.now() - 60_000);
  const expiresAt         = new Date(Date.now() + 29 * 86_400_000);
  const replacementUsedAt = new Date(Date.now() - 30_000);
  mockFindUnique.mockResolvedValueOnce({ status: 'consumed', expiresAt, consumedAt, replacementUsedAt, updatedAt: new Date() });
  const result = await checkUploadEntitlement('user-11', false);
  expect(result.allowed).toBe(false);
  if (!result.allowed) expect(result.reason).toBe('consumed');
});

test('TC-ENT-14: beginReplacementUpload locks via replacementUsedAt and returns true', async () => {
  mockUpdateMany.mockResolvedValueOnce({ count: 1 });
  const result = await beginReplacementUpload('user-12');
  expect(result).toBe(true);
  expect(mockUpdateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ status: 'consumed', replacementUsedAt: null }),
      data:  expect.objectContaining({ replacementUsedAt: expect.any(Date) }),
    }),
  );
  // Regression guard: locking a replacement must never touch status.
  const call = mockUpdateMany.mock.calls[0][0];
  expect(call.data).not.toHaveProperty('status');
});

test('TC-ENT-15: beginReplacementUpload returns false when already used or outside the window', async () => {
  mockUpdateMany.mockResolvedValueOnce({ count: 0 });
  const result = await beginReplacementUpload('user-13');
  expect(result).toBe(false);
});

test('TC-ENT-16: revertReplacementUpload clears replacementUsedAt and never touches status', async () => {
  mockUpdateMany.mockResolvedValueOnce({ count: 1 });
  await revertReplacementUpload('user-14');
  expect(mockUpdateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-14', status: 'consumed' }),
      data:  { replacementUsedAt: null },
    }),
  );
  // Regression guard: a failed replacement must leave status at 'consumed' —
  // flipping it to 'eligible' would wrongly grant a fresh 30-day trial.
  const call = mockUpdateMany.mock.calls[0][0];
  expect(call.data).not.toHaveProperty('status');
});

test('TC-ENT-17: consumeReplacementUpload only updates importLogId, never consumedAt/expiresAt/status', async () => {
  const mockTxUpdate = jest.fn(async (_args: { where: unknown; data: Record<string, unknown> }) => ({}));
  const tx = { entitlement: { update: mockTxUpdate } } as any;

  await consumeReplacementUpload(tx, 'user-15', 'importlog-99');

  expect(mockTxUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { userId: 'user-15' },
      data:  expect.objectContaining({ importLogId: 'importlog-99' }),
    }),
  );
  const call = mockTxUpdate.mock.calls[0][0];
  expect(call.data).not.toHaveProperty('consumedAt');
  expect(call.data).not.toHaveProperty('expiresAt');
  expect(call.data).not.toHaveProperty('status');
});

// ── Closing pre-existing coverage gaps ──────────────────────────────────────────

test('TC-ENT-18: consumeEntitlement sets status, consumedAt, expiresAt (+30d), and importLogId', async () => {
  const mockTxUpdate = jest.fn(async (_args: { where: unknown; data: Record<string, any> }) => ({}));
  const tx = { entitlement: { update: mockTxUpdate } } as any;

  const before = Date.now();
  await consumeEntitlement(tx, 'user-16', 'importlog-1');
  const after = Date.now();

  expect(mockTxUpdate).toHaveBeenCalledWith(expect.objectContaining({
    where: { userId: 'user-16' },
    data: expect.objectContaining({
      status:      'consumed',
      importLogId: 'importlog-1',
    }),
  }));
  const data = mockTxUpdate.mock.calls[0][0].data;
  expect(data.consumedAt.getTime()).toBeGreaterThanOrEqual(before);
  expect(data.consumedAt.getTime()).toBeLessThanOrEqual(after);
  expect(data.expiresAt.getTime() - data.consumedAt.getTime()).toBe(30 * 86_400_000);
});

test('TC-ENT-19: createEntitlementForUser creates an eligible row for the given user/workspace', async () => {
  const mockTxCreate = jest.fn(async () => ({}));
  const tx = { entitlement: { create: mockTxCreate } } as any;

  await createEntitlementForUser(tx, 'user-17', 'ws-1');

  expect(mockTxCreate).toHaveBeenCalledWith({
    data: { userId: 'user-17', workspaceId: 'ws-1', status: 'eligible' },
  });
});

test('TC-ENT-20: restoreEntitlement resets status/consumedAt/expiresAt/importLogId/replacementUsedAt', async () => {
  mockUpdate.mockResolvedValueOnce({});
  await restoreEntitlement('user-18', 'admin-1', 'goodwill reset');

  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    where: { userId: 'user-18' },
    data: expect.objectContaining({
      status:            'eligible',
      consumedAt:        null,
      expiresAt:         null,
      importLogId:       null,
      replacementUsedAt: null,
      restoredBy:        'admin-1',
      restoredNote:      'goodwill reset',
    }),
  }));
});
