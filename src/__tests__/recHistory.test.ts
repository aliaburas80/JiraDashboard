// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Recommendation History tests — TC-RH-01 to TC-RH-08

if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', { value: global, writable: true });
}
const store: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { Object.keys(store).forEach(k => delete store[k]); },
  },
});

import {
  saveRecSnapshot, getRecHistory, getLatestEntry,
  clearRecHistory, getNewTitles, getResolvedRecs,
} from '../lib/recHistory';

const REC_A = { type: 'critical', icon: '🚫', title: 'Fix blockers', detail: '2 critical' };
const REC_B = { type: 'warning',  icon: '⚖️', title: 'Balance capacity', detail: 'Jordan 40%' };
const REC_C = { type: 'info',     icon: '👻', title: 'Link orphans', detail: '3 orphans' };

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

// TC-RH-01: getRecHistory returns empty array initially
test('TC-RH-01: getRecHistory returns [] with no data', () => {
  expect(getRecHistory()).toHaveLength(0);
});

// TC-RH-02: saveRecSnapshot saves a first entry
test('TC-RH-02: saveRecSnapshot saves first entry', () => {
  saveRecSnapshot(72, [REC_A, REC_B]);
  expect(getRecHistory()).toHaveLength(1);
  expect(getLatestEntry()?.recommendations).toHaveLength(2);
  expect(getLatestEntry()?.healthScore).toBe(72);
});

// TC-RH-03: saving same recommendations does not add a new entry (dedup)
test('TC-RH-03: duplicate recs do not create new snapshot', () => {
  saveRecSnapshot(72, [REC_A, REC_B]);
  saveRecSnapshot(72, [REC_B, REC_A]); // same titles, different order
  expect(getRecHistory()).toHaveLength(1);
});

// TC-RH-04: different recommendations DO create a new entry
test('TC-RH-04: changed recs create new snapshot', () => {
  saveRecSnapshot(72, [REC_A, REC_B]);
  saveRecSnapshot(65, [REC_A, REC_C]); // REC_C is new
  expect(getRecHistory()).toHaveLength(2);
});

// TC-RH-05: history is capped at 10 entries
test('TC-RH-05: history capped at 10 entries', () => {
  for (let i = 0; i < 12; i++) {
    saveRecSnapshot(70, [{ type: 'info', icon: '•', title: `Rec ${i}`, detail: '' }]);
  }
  expect(getRecHistory().length).toBeLessThanOrEqual(10);
});

// TC-RH-06: getNewTitles returns titles absent from the last snapshot
test('TC-RH-06: getNewTitles identifies newly appeared recommendations', () => {
  saveRecSnapshot(72, [REC_A]);
  saveRecSnapshot(65, [REC_A, REC_B]); // REC_B is new
  const newTitles = getNewTitles([REC_A.title, REC_B.title]);
  expect(newTitles.has(REC_B.title)).toBe(true);
  expect(newTitles.has(REC_A.title)).toBe(false);
});

// TC-RH-07: getResolvedRecs returns recs no longer present
test('TC-RH-07: getResolvedRecs identifies resolved recommendations', () => {
  saveRecSnapshot(65, [REC_A, REC_B]);
  saveRecSnapshot(72, [REC_A]); // REC_B resolved
  const resolved = getResolvedRecs([REC_A.title]);
  expect(resolved.some(r => r.title === REC_B.title)).toBe(true);
  expect(resolved.some(r => r.title === REC_A.title)).toBe(false);
});

// TC-RH-08: clearRecHistory empties all entries
test('TC-RH-08: clearRecHistory removes all entries', () => {
  saveRecSnapshot(72, [REC_A]);
  clearRecHistory();
  expect(getRecHistory()).toHaveLength(0);
  expect(getLatestEntry()).toBeNull();
});
