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

beforeEach(() => localStorageMock.clear());

const baseEntry = { fileName: 'export.xlsx', fileType: 'xlsx', totalIssues: 42, healthScore: 88, status: 'success' as const, warningsCount: 0 };

test('TC-LIH-01: listLocalImports returns empty array on first visit', () => {
  expect(listLocalImports()).toEqual([]);
});

test('TC-LIH-02: addLocalImport persists a record retrievable via listLocalImports', () => {
  const { record, quotaExceeded } = addLocalImport(baseEntry);
  expect(quotaExceeded).toBe(false);
  const listed = listLocalImports();
  expect(listed).toHaveLength(1);
  expect(listed[0]).toEqual(record);
  expect(listed[0].fileName).toBe('export.xlsx');
});

test('TC-LIH-03: addLocalImport prepends newest first', () => {
  addLocalImport({ ...baseEntry, fileName: 'first.xlsx' });
  addLocalImport({ ...baseEntry, fileName: 'second.xlsx' });
  const listed = listLocalImports();
  expect(listed[0].fileName).toBe('second.xlsx');
  expect(listed[1].fileName).toBe('first.xlsx');
});

test('TC-LIH-04: history is capped at 20 entries', () => {
  for (let i = 0; i < 25; i++) addLocalImport({ ...baseEntry, fileName: `file-${i}.xlsx` });
  expect(listLocalImports()).toHaveLength(20);
  // Most recent (file-24) survives; oldest (file-0..4) are dropped.
  expect(listLocalImports()[0].fileName).toBe('file-24.xlsx');
});

test('TC-LIH-05: removeLocalImport deletes only the targeted record', () => {
  const { record: first }  = addLocalImport({ ...baseEntry, fileName: 'keep.xlsx' });
  const { record: second } = addLocalImport({ ...baseEntry, fileName: 'remove.xlsx' });
  removeLocalImport(second.id);
  const listed = listLocalImports();
  expect(listed).toHaveLength(1);
  expect(listed[0].id).toBe(first.id);
});

test('TC-LIH-06: clearLocalImportHistory empties the list', () => {
  addLocalImport(baseEntry);
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

test('TC-LIH-09: addLocalImport reports quotaExceeded without throwing when storage is full', () => {
  const originalSetItem = localStorageMock.setItem;
  (localStorageMock as any).setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); };
  const { quotaExceeded } = addLocalImport(baseEntry);
  expect(quotaExceeded).toBe(true);
  (localStorageMock as any).setItem = originalSetItem;
});
