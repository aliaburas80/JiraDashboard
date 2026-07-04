// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Clear Local Data tests — TC-CLD-01 to TC-CLD-10

import { hasLocalData, clearLocalData, DC_FIXED_KEYS } from '../lib/clearLocalData';

// Jest runs in Node — define window so the typeof window guards pass
if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', { value: global, writable: true });
}

// ── localStorage mock ────────────────────────────────────────────────────────
const lsStore: Record<string, string> = {};
const localStorageMock = {
  getItem:    (k: string)              => lsStore[k] ?? null,
  setItem:    (k: string, v: string)   => { lsStore[k] = v; },
  removeItem: (k: string)              => { delete lsStore[k]; },
  clear:      ()                       => { Object.keys(lsStore).forEach(k => delete lsStore[k]); },
  get length() { return Object.keys(lsStore).length; },
  key:        (i: number)              => Object.keys(lsStore)[i] ?? null,
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// ── sessionStorage mock ──────────────────────────────────────────────────────
const ssStore: Record<string, string> = {};
const sessionStorageMock = {
  getItem:    (k: string)              => ssStore[k] ?? null,
  setItem:    (k: string, v: string)   => { ssStore[k] = v; },
  removeItem: (k: string)              => { delete ssStore[k]; },
  clear:      ()                       => { Object.keys(ssStore).forEach(k => delete ssStore[k]); },
};
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// TC-CLD-01: hasLocalData returns false when storage is empty
test('TC-CLD-01: hasLocalData returns false when no DC data present', () => {
  expect(hasLocalData()).toBe(false);
});

// TC-CLD-02: hasLocalData returns true when metrics key exists
test('TC-CLD-02: hasLocalData returns true when dc_metrics_v2 exists', () => {
  lsStore['dc_metrics_v2'] = '{}';
  expect(hasLocalData()).toBe(true);
});

// TC-CLD-03: hasLocalData returns true for any DC key
test('TC-CLD-03: hasLocalData returns true for any known DC key', () => {
  lsStore['dc_filter_presets'] = '[]';
  expect(hasLocalData()).toBe(true);
});

// TC-CLD-04: hasLocalData detects dynamic dc_col_order_ prefix
test('TC-CLD-04: hasLocalData detects dc_col_order_* dynamic keys', () => {
  lsStore['dc_col_order_flow_table'] = '[0,1,2]';
  expect(hasLocalData()).toBe(true);
});

// TC-CLD-05: hasLocalData ignores unrelated keys
test('TC-CLD-05: hasLocalData ignores non-DC keys', () => {
  lsStore['someOtherApp_key'] = 'value';
  lsStore['_ga'] = 'GA1.2.xxx';
  expect(hasLocalData()).toBe(false);
});

// TC-CLD-06: clearLocalData removes all fixed DC keys
test('TC-CLD-06: clearLocalData removes all fixed DC keys', () => {
  DC_FIXED_KEYS.forEach(k => { lsStore[k] = 'test'; });
  clearLocalData();
  DC_FIXED_KEYS.forEach(k => {
    expect(lsStore[k]).toBeUndefined();
  });
});

// TC-CLD-07: clearLocalData removes dynamic dc_col_order_ keys
test('TC-CLD-07: clearLocalData removes dc_col_order_* keys', () => {
  lsStore['dc_col_order_flow'] = '[0,1]';
  lsStore['dc_col_order_epic'] = '[2,3]';
  clearLocalData();
  expect(lsStore['dc_col_order_flow']).toBeUndefined();
  expect(lsStore['dc_col_order_epic']).toBeUndefined();
});

// TC-CLD-08: clearLocalData does not touch unrelated keys
test('TC-CLD-08: clearLocalData preserves non-DC keys', () => {
  lsStore['dc_metrics_v2'] = '{}';
  lsStore['someOtherApp_prefs'] = 'keep_me';
  lsStore['_ga'] = 'GA1.2.xxx';
  clearLocalData();
  expect(lsStore['someOtherApp_prefs']).toBe('keep_me');
  expect(lsStore['_ga']).toBe('GA1.2.xxx');
});

// TC-CLD-09: hasLocalData returns false immediately after clearLocalData
test('TC-CLD-09: hasLocalData returns false after clearLocalData', () => {
  lsStore['dc_metrics_v2'] = '{}';
  lsStore['dc_filter_presets'] = '[]';
  clearLocalData();
  expect(hasLocalData()).toBe(false);
});

// TC-CLD-10: clearLocalData also removes DC keys from sessionStorage
test('TC-CLD-10: clearLocalData clears sessionStorage DC keys', () => {
  ssStore['dc_metrics_v2'] = '{}';
  clearLocalData();
  expect(ssStore['dc_metrics_v2']).toBeUndefined();
});
