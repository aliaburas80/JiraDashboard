// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-024: per-user "bring your own cloud" storage — TC-UBYOC-01 to TC-UBYOC-14.

const mockFindUnique = jest.fn();
const mockUpsert     = jest.fn();
const mockUpdate     = jest.fn();
const mockDeleteMany = jest.fn();
const mockCreateProvider = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    userStorageProvider: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      upsert:     (...a: unknown[]) => mockUpsert(...a),
      update:     (...a: unknown[]) => mockUpdate(...a),
      deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
    },
  },
}));

jest.mock('../lib/secret-field', () => ({
  encryptSecret: (v: string) => `ENC(${v})`,
  decryptSecret: (v: string) => v.replace(/^ENC\(/, '').replace(/\)$/, ''),
}));

jest.mock('../services/storage/storageProvider', () => ({
  createProvider: (...a: unknown[]) => mockCreateProvider(...a),
}));

import {
  getUserStorageProviderSafe,
  saveUserStorageProvider,
  testUserStorageProvider,
  deleteUserStorageProvider,
  getUserStorageProviderStatus,
  getVerifiedUserStorageProviderInstance,
} from '../services/storage/userStorageProvider.service';

const USER_ID = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Save validation ──────────────────────────────────────────────────────────

test('TC-UBYOC-01: save rejects S3 config missing bucket', async () => {
  const result = await saveUserStorageProvider(USER_ID, { provider: 's3', config: {}, credentials: { accessKeyId: 'a', secretAccessKey: 'b' } });
  expect(result.ok).toBe(false);
  expect(mockUpsert).not.toHaveBeenCalled();
});

test('TC-UBYOC-02: save rejects Azure config missing containerName', async () => {
  const result = await saveUserStorageProvider(USER_ID, { provider: 'azure', config: {}, credentials: { connectionString: 'x' } });
  expect(result.ok).toBe(false);
});

test('TC-UBYOC-03: save rejects GCP config missing bucket or projectId', async () => {
  const r1 = await saveUserStorageProvider(USER_ID, { provider: 'gcp', config: { projectId: 'p' }, credentials: { keyJson: '{}' } });
  expect(r1.ok).toBe(false);
  const r2 = await saveUserStorageProvider(USER_ID, { provider: 'gcp', config: { bucket: 'b' }, credentials: { keyJson: '{}' } });
  expect(r2.ok).toBe(false);
});

test('TC-UBYOC-04: save requires credentials when configuring a brand-new provider', async () => {
  mockFindUnique.mockResolvedValue(null);
  const result = await saveUserStorageProvider(USER_ID, { provider: 's3', config: { bucket: 'my-bucket' }, credentials: {} });
  expect(result.ok).toBe(false);
  expect(mockUpsert).not.toHaveBeenCalled();
});

test('TC-UBYOC-05: save succeeds with valid config and credentials, encrypting the credentials blob', async () => {
  mockFindUnique.mockResolvedValue(null);
  mockUpsert.mockResolvedValue({});
  const result = await saveUserStorageProvider(USER_ID, {
    provider: 's3',
    config: { bucket: 'my-bucket', region: 'us-east-1' },
    credentials: { accessKeyId: 'AKIA', secretAccessKey: 'secret' },
  });
  expect(result.ok).toBe(true);
  const call = mockUpsert.mock.calls[0][0];
  // Proves the credentials went through encryptSecret() rather than being
  // stored as raw JSON — the mock wraps encrypted values as "ENC(...)".
  expect(call.create.credentialsEnc).toMatch(/^ENC\(/);
  expect(call.create.configJson).not.toContain('secret'); // secrets never leak into the non-secret config column
});

// TC-UBYOC-06: save always resets verified to false
test('TC-UBYOC-06: save always resets verified: false, even on an already-verified provider', async () => {
  mockFindUnique.mockResolvedValue({ provider: 's3', credentialsEnc: 'ENC(old)' });
  mockUpsert.mockResolvedValue({});
  await saveUserStorageProvider(USER_ID, { provider: 's3', config: { bucket: 'b2' }, credentials: {} });
  const call = mockUpsert.mock.calls[0][0];
  expect(call.update.verified).toBe(false);
  expect(call.update.verifiedAt).toBeNull();
});

// TC-UBYOC-07: blank credentials on an unchanged provider type keep the existing encrypted blob
test('TC-UBYOC-07: blank credential fields on the same provider type keep the existing encrypted credentials', async () => {
  mockFindUnique.mockResolvedValue({ provider: 's3', credentialsEnc: 'ENC(existing-creds)' });
  mockUpsert.mockResolvedValue({});
  await saveUserStorageProvider(USER_ID, { provider: 's3', config: { bucket: 'b2' }, credentials: {} });
  const call = mockUpsert.mock.calls[0][0];
  expect(call.update.credentialsEnc).toBe('ENC(existing-creds)');
});

// TC-UBYOC-08: blank credentials when SWITCHING provider type is rejected (old creds are for a different provider)
test('TC-UBYOC-08: blank credentials when switching provider type is rejected, never reuses the old provider\'s credentials', async () => {
  mockFindUnique.mockResolvedValue({ provider: 'azure', credentialsEnc: 'ENC(azure-creds)' });
  const result = await saveUserStorageProvider(USER_ID, { provider: 's3', config: { bucket: 'b2' }, credentials: {} });
  expect(result.ok).toBe(false);
  expect(mockUpsert).not.toHaveBeenCalled();
});

// ── Safe read never exposes credentials ─────────────────────────────────────

test('TC-UBYOC-09: getUserStorageProviderSafe never includes credentialsEnc or decrypted credentials', async () => {
  mockFindUnique.mockResolvedValue({
    provider: 's3', configJson: JSON.stringify({ bucket: 'b' }), credentialsEnc: 'ENC(super-secret)',
    verified: true, verifiedAt: new Date('2026-01-01'), lastError: null,
  });
  const safe = await getUserStorageProviderSafe(USER_ID);
  expect(JSON.stringify(safe)).not.toContain('super-secret');
  expect(JSON.stringify(safe)).not.toContain('credentialsEnc');
  expect(safe?.verified).toBe(true);
});

test('TC-UBYOC-10: getUserStorageProviderSafe returns null when nothing is configured', async () => {
  mockFindUnique.mockResolvedValue(null);
  expect(await getUserStorageProviderSafe(USER_ID)).toBeNull();
});

// ── Test connection ──────────────────────────────────────────────────────────

test('TC-UBYOC-11: testUserStorageProvider sets verified: true only on a real provider success', async () => {
  mockFindUnique.mockResolvedValue({ provider: 's3', configJson: JSON.stringify({ bucket: 'b' }), credentialsEnc: 'ENC({"accessKeyId":"a"})' });
  mockCreateProvider.mockResolvedValue({ test: jest.fn(async () => ({ ok: true })) });
  mockUpdate.mockResolvedValue({});

  const result = await testUserStorageProvider(USER_ID);
  expect(result.ok).toBe(true);
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ verified: true }),
  }));
});

test('TC-UBYOC-12: testUserStorageProvider sets verified: false with the provider\'s error on failure', async () => {
  mockFindUnique.mockResolvedValue({ provider: 's3', configJson: JSON.stringify({ bucket: 'b' }), credentialsEnc: null });
  mockCreateProvider.mockResolvedValue({ test: jest.fn(async () => ({ ok: false, error: 'Access denied' })) });
  mockUpdate.mockResolvedValue({});

  const result = await testUserStorageProvider(USER_ID);
  expect(result.ok).toBe(false);
  expect(result.error).toBe('Access denied');
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ verified: false, lastError: 'Access denied' }),
  }));
});

test('TC-UBYOC-13: testUserStorageProvider handles a thrown error from createProvider/test gracefully', async () => {
  mockFindUnique.mockResolvedValue({ provider: 's3', configJson: JSON.stringify({ bucket: 'b' }), credentialsEnc: null });
  mockCreateProvider.mockRejectedValue(new Error('network unreachable'));

  const result = await testUserStorageProvider(USER_ID);
  expect(result.ok).toBe(false);
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ verified: false }),
  }));
});

test('TC-UBYOC-14: testUserStorageProvider returns a clear error when nothing is configured yet', async () => {
  mockFindUnique.mockResolvedValue(null);
  const result = await testUserStorageProvider(USER_ID);
  expect(result.ok).toBe(false);
  expect(result.error).toMatch(/no storage provider/i);
});

// ── Delete ───────────────────────────────────────────────────────────────────

test('TC-UBYOC-15: deleteUserStorageProvider removes the row', async () => {
  mockDeleteMany.mockResolvedValue({ count: 1 });
  await deleteUserStorageProvider(USER_ID);
  expect(mockDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
});

// ── Upload-path helpers ──────────────────────────────────────────────────────

test('TC-UBYOC-16: getUserStorageProviderStatus returns none/unverified/verified correctly', async () => {
  mockFindUnique.mockResolvedValueOnce(null);
  expect(await getUserStorageProviderStatus(USER_ID)).toBe('none');

  mockFindUnique.mockResolvedValueOnce({ verified: false });
  expect(await getUserStorageProviderStatus(USER_ID)).toBe('unverified');

  mockFindUnique.mockResolvedValueOnce({ verified: true });
  expect(await getUserStorageProviderStatus(USER_ID)).toBe('verified');
});

test('TC-UBYOC-17: getVerifiedUserStorageProviderInstance returns null when not verified', async () => {
  mockFindUnique.mockResolvedValue({ verified: false, provider: 's3', configJson: '{}', credentialsEnc: null });
  expect(await getVerifiedUserStorageProviderInstance(USER_ID)).toBeNull();
  expect(mockCreateProvider).not.toHaveBeenCalled();
});

test('TC-UBYOC-18: getVerifiedUserStorageProviderInstance builds a real provider instance only when verified', async () => {
  mockFindUnique.mockResolvedValue({ verified: true, provider: 's3', configJson: JSON.stringify({ bucket: 'b' }), credentialsEnc: 'ENC({"accessKeyId":"a"})' });
  const fakeInstance = { upload: jest.fn() };
  mockCreateProvider.mockResolvedValue(fakeInstance);

  const instance = await getVerifiedUserStorageProviderInstance(USER_ID);
  expect(instance).toBe(fakeInstance);
  expect(mockCreateProvider).toHaveBeenCalledWith('s3', expect.objectContaining({ active: 's3' }));
});
