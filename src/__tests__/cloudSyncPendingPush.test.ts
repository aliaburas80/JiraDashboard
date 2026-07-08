// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Bug fix, 2026-07-08: "upload succeeds, dashboard shows the old cached
// data." Root cause — pushToCloud() (fired non-blocking after every local
// data write: upload, merge, profile save, etc.) only marked pendingPush on
// FAILURE, never before starting the slow network push. A concurrent
// GET /api/metrics/latest during that window had no way to know a push was
// in flight, so syncFromCloud() could restore an older bucket backup over
// the just-written fresh data. TC-PENDPUSH-01 to TC-PENDPUSH-07.

const files: Record<string, string> = {};

jest.mock('fs', () => ({
  existsSync:    (p: string) => Object.prototype.hasOwnProperty.call(files, p),
  readFileSync:  (p: string) => files[p],
  writeFileSync: (p: string, content: string) => { files[p] = content; },
  mkdirSync:     jest.fn(),
}));

const CACHE_FILE = `${process.cwd()}/data/.cloud-cache-meta.json`;

function readCacheFile(): any {
  return JSON.parse(files[CACHE_FILE]);
}

beforeEach(() => {
  for (const k of Object.keys(files)) delete files[k];
  jest.resetModules();
});

// ── markPendingPush() ───────────────────────────────────────────────────────

test('TC-PENDPUSH-01: markPendingPush creates cache metadata when none exists yet (was previously a no-op)', async () => {
  const { markPendingPush } = await import('../services/storage/cloudSync');
  markPendingPush();
  expect(files[CACHE_FILE]).toBeDefined();
  expect(readCacheFile().pendingPush).toBe(true);
});

test('TC-PENDPUSH-02: markPendingPush preserves existing cache fields while flipping pendingPush', async () => {
  files[CACHE_FILE] = JSON.stringify({
    provider: 's3', key: 'backup-1.json', contentHash: 'abc123',
    fetchedAt: '2026-07-01T00:00:00.000Z', pendingPush: false,
  });
  const { markPendingPush } = await import('../services/storage/cloudSync');
  markPendingPush();
  const meta = readCacheFile();
  expect(meta.pendingPush).toBe(true);
  expect(meta.provider).toBe('s3');
  expect(meta.key).toBe('backup-1.json');
  expect(meta.contentHash).toBe('abc123');
});

// ── pushToCloud() ────────────────────────────────────────────────────────────

function mockCloudDeps(opts: { uploadDelayMs?: number } = {}) {
  jest.doMock('@/services/storage/storageProvider', () => ({
    readStorageSettings: jest.fn(() => ({ active: 's3' })),
    createProvider: jest.fn(async () => ({
      upload: jest.fn(async (_filename: string, _content: string) => {
        if (opts.uploadDelayMs) await new Promise(r => setTimeout(r, opts.uploadDelayMs));
        return 'backup-new.json';
      }),
    })),
  }));
  jest.doMock('@/services/settings/backup.service', () => ({
    createBackup: jest.fn(() => ({ users: [] })),
  }));
}

test('TC-PENDPUSH-03: pushToCloud marks pendingPush true before the (slow) upload resolves', async () => {
  mockCloudDeps({ uploadDelayMs: 20 });
  const { pushToCloud } = await import('../services/storage/cloudSync');

  const pushPromise = pushToCloud();
  // Give markPendingPush's synchronous write a chance to land before the
  // mocked upload's artificial delay resolves.
  await new Promise(r => setTimeout(r, 0));
  expect(readCacheFile().pendingPush).toBe(true);

  await pushPromise;
});

test('TC-PENDPUSH-04: pushToCloud clears pendingPush and records the new key on success', async () => {
  mockCloudDeps();
  const { pushToCloud } = await import('../services/storage/cloudSync');

  const result = await pushToCloud();

  expect(result.status).toBe('pushed');
  const meta = readCacheFile();
  expect(meta.pendingPush).toBe(false);
  expect(meta.key).toBe('backup-new.json');
});

test('TC-PENDPUSH-05: pushToCloud does not touch the pending flag when storage mode is local (nothing to push)', async () => {
  jest.doMock('@/services/storage/storageProvider', () => ({
    readStorageSettings: jest.fn(() => ({ active: 'local' })),
    createProvider: jest.fn(),
  }));
  const { pushToCloud } = await import('../services/storage/cloudSync');

  const result = await pushToCloud();

  expect(result.status).toBe('offline');
  expect(files[CACHE_FILE]).toBeUndefined();
});

test('TC-PENDPUSH-06: pushToCloud re-marks pendingPush on failure (existing retry-marker behavior, unchanged)', async () => {
  jest.doMock('@/services/storage/storageProvider', () => ({
    readStorageSettings: jest.fn(() => ({ active: 's3' })),
    createProvider: jest.fn(async () => ({
      upload: jest.fn(async () => { throw new Error('network down'); }),
    })),
  }));
  jest.doMock('@/services/settings/backup.service', () => ({
    createBackup: jest.fn(() => ({ users: [] })),
  }));
  const { pushToCloud } = await import('../services/storage/cloudSync');

  const result = await pushToCloud();

  expect(result.status).toBe('error');
  expect(readCacheFile().pendingPush).toBe(true);
});

test('TC-PENDPUSH-07: getCacheMeta reflects the pending state a caller would see mid-push', async () => {
  mockCloudDeps({ uploadDelayMs: 20 });
  const { pushToCloud, getCacheMeta } = await import('../services/storage/cloudSync');

  const pushPromise = pushToCloud();
  await new Promise(r => setTimeout(r, 0));
  expect(getCacheMeta()?.pendingPush).toBe(true);

  await pushPromise;
  expect(getCacheMeta()?.pendingPush).toBe(false);
});
