// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Load-error signal tests — TC-LES-01 to TC-LES-06

import { redirectWithLoadError, consumeLoadErrorSignal } from '../lib/loadErrorSignal';

if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', { value: global, writable: true });
}

const ssStore: Record<string, string> = {};
const sessionStorageMock = {
  getItem:    (k: string)            => ssStore[k] ?? null,
  setItem:    (k: string, v: string) => { ssStore[k] = v; },
  removeItem: (k: string)            => { delete ssStore[k]; },
};
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock, configurable: true });

beforeEach(() => {
  Object.keys(ssStore).forEach(k => delete ssStore[k]);
});

// TC-LES-01: redirectWithLoadError stores a default message and redirects
test('TC-LES-01: redirectWithLoadError stores a default message and calls router.replace', () => {
  const router = { replace: jest.fn() };
  redirectWithLoadError(router);
  expect(router.replace).toHaveBeenCalledWith('/');
  expect(ssStore['dc_load_error_v1']).toMatch(/couldn.t load your dashboard data/i);
});

// TC-LES-02: redirectWithLoadError stores a custom message when given one
test('TC-LES-02: redirectWithLoadError stores a custom message', () => {
  const router = { replace: jest.fn() };
  redirectWithLoadError(router, 'Custom failure message.');
  expect(ssStore['dc_load_error_v1']).toBe('Custom failure message.');
});

// TC-LES-03: consumeLoadErrorSignal returns the stored message
test('TC-LES-03: consumeLoadErrorSignal returns the stored message', () => {
  ssStore['dc_load_error_v1'] = 'Something failed.';
  expect(consumeLoadErrorSignal()).toBe('Something failed.');
});

// TC-LES-04: consumeLoadErrorSignal clears the signal after reading it
test('TC-LES-04: consumeLoadErrorSignal clears the key so it does not reappear later', () => {
  ssStore['dc_load_error_v1'] = 'Something failed.';
  consumeLoadErrorSignal();
  expect(ssStore['dc_load_error_v1']).toBeUndefined();
  expect(consumeLoadErrorSignal()).toBeNull();
});

// TC-LES-05: consumeLoadErrorSignal returns null when nothing was signaled
test('TC-LES-05: consumeLoadErrorSignal returns null when no error was recorded', () => {
  expect(consumeLoadErrorSignal()).toBeNull();
});

// TC-LES-06: a genuine no-data redirect (no signal set) is indistinguishable
// from a normal first-time visit -- the whole point of keeping this signal
// opt-in rather than always-on.
test('TC-LES-06: a plain router.replace with no signal leaves consumeLoadErrorSignal at null', () => {
  const router = { replace: jest.fn() };
  router.replace('/'); // simulates the unchanged "no data" redirect path
  expect(consumeLoadErrorSignal()).toBeNull();
});
