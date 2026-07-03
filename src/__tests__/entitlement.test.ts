// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
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
  const expiresAt = new Date(Date.now() + 10 * 86_400_000); // 10 days remaining
  mockFindUnique.mockResolvedValueOnce({ status: 'consumed', expiresAt, consumedAt: new Date(), updatedAt: new Date() });
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
