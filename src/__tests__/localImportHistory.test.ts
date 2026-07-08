// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-017: local-storage-mode import history — TC-LIH-01 to TC-LIH-09

import {
  listLocalImports,
  addLocalImport,
  removeLocalImport,
  clearLocalImportHistory,
  LOCAL_IMPORT_HISTORY_KEY,
} from '../lib/localImportHistory';

// Jest runs in Node — define window so the typeof window guards pass
if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', { value: global, writable: true });
}

const lsStore: Record<string, string> = {};
const localStorageMock = {
  getItem:    (k: string)            => lsStore[k] ?? null,
  setItem:    (k: string, v: string) => { lsStore[k] = v; },
  removeItem: (k: string)            => { delete lsStore[k]; },
  clear:      ()                     => { Object.keys(lsStore).forEach(k => delete lsStore[k]); },
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// addLocalImport() is async — it awaits tagCurrentOwner(), which calls
// fetchCurrentUser() (GET /api/auth/me). Without this mock, fetch is
// undefined in the Node test environment and tagCurrentOwner() would reject,
// making every addLocalImport() call here wrongly resolve quotaExceeded:true.
(global as any).fetch = jest.fn(async () => ({
  ok: true,
  json: async () => ({ userId: 'user-a', email: 'a@test.com', name: 'a', role: 'user' }),
}));

beforeEach(() => localStorageMock.clear());

const baseEntry = { fileName: 'export.xlsx', fileType: 'xlsx', totalIssues: 42, healthScore: 88, status: 'success' as const, warningsCount: 0 };

test('TC-LIH-01: listLocalImports returns empty array on first visit', () => {
  expect(listLocalImports()).toEqual([]);
});

test('TC-LIH-02: addLocalImport persists a record retrievable via listLocalImports', async () => {
  const { record, quotaExceeded } = await addLocalImport(baseEntry);
  expect(quotaExceeded).toBe(false);
  const listed = listLocalImports();
  expect(listed).toHaveLength(1);
  expect(listed[0]).toEqual(record);
  expect(listed[0].fileName).toBe('export.xlsx');
});

test('TC-LIH-03: addLocalImport prepends newest first', async () => {
  await addLocalImport({ ...baseEntry, fileName: 'first.xlsx' });
  await addLocalImport({ ...baseEntry, fileName: 'second.xlsx' });
  const listed = listLocalImports();
  expect(listed[0].fileName).toBe('second.xlsx');
  expect(listed[1].fileName).toBe('first.xlsx');
});

test('TC-LIH-04: history is capped at 20 entries', async () => {
  for (let i = 0; i < 25; i++) await addLocalImport({ ...baseEntry, fileName: `file-${i}.xlsx` });
  expect(listLocalImports()).toHaveLength(20);
  // Most recent (file-24) survives; oldest (file-0..4) are dropped.
  expect(listLocalImports()[0].fileName).toBe('file-24.xlsx');
});

test('TC-LIH-05: removeLocalImport deletes only the targeted record', async () => {
  const { record: first }  = await addLocalImport({ ...baseEntry, fileName: 'keep.xlsx' });
  const { record: second } = await addLocalImport({ ...baseEntry, fileName: 'remove.xlsx' });
  removeLocalImport(second.id);
  const listed = listLocalImports();
  expect(listed).toHaveLength(1);
  expect(listed[0].id).toBe(first.id);
});

test('TC-LIH-06: clearLocalImportHistory empties the list', async () => {
  await addLocalImport(baseEntry);
  clearLocalImportHistory();
  expect(listLocalImports()).toEqual([]);
});

test('TC-LIH-07: listLocalImports drops malformed/corrupt entries instead of throwing', () => {
  lsStore[LOCAL_IMPORT_HISTORY_KEY] = JSON.stringify([
    { id: 'ok-1', fileName: 'valid.xlsx', fileType: 'xlsx', totalIssues: 1, healthScore: 90, status: 'success', warningsCount: 0, uploadedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'bad-1', fileName: 42 }, // malformed — wrong types / missing fields
    'not even an object',
  ]);
  const listed = listLocalImports();
  expect(listed).toHaveLength(1);
  expect(listed[0].id).toBe('ok-1');
});

test('TC-LIH-08: listLocalImports returns empty array on unparsable JSON rather than throwing', () => {
  lsStore[LOCAL_IMPORT_HISTORY_KEY] = '{not json';
  expect(listLocalImports()).toEqual([]);
});

test('TC-LIH-09: addLocalImport reports quotaExceeded without throwing when storage is full', async () => {
  const originalSetItem = localStorageMock.setItem;
  (localStorageMock as any).setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
  const { quotaExceeded } = await addLocalImport(baseEntry);
  expect(quotaExceeded).toBe(true);
  (localStorageMock as any).setItem = originalSetItem;
});

// P0 fix, 2026-07-08: addLocalImport() used to fire tagCurrentOwner() without
// awaiting it (same bug class fixed in storage.ts's saveMetrics() — see
// crossAccountDataIsolation.test.ts TC-DATAISO-14/15). A caller awaiting
// addLocalImport() must be able to trust the owner tag is written by the
// time it resolves, even under real network latency.
test('TC-LIH-10: addLocalImport does not resolve until the ownership tag is written, even under network latency', async () => {
  (global as any).fetch = jest.fn(async (url: string) => {
    if (url === '/api/auth/me') {
      await new Promise(r => setTimeout(r, 20));
      return { ok: true, json: async () => ({ userId: 'user-a', email: 'a@test.com', name: 'a', role: 'user' }) };
    }
    return { ok: true, json: async () => ({}) };
  });

  await addLocalImport(baseEntry);

  expect(lsStore['dc_local_import_history_owner_v1']).toBe('user-a');
});
