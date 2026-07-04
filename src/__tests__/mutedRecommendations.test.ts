// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Muted recommendations tests — TC-MR-01 to TC-MR-10

// Mock localStorage
const store: Record<string, string> = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
  },
});

beforeEach(() => Object.keys(store).forEach(k => delete store[k]));

import {
  recKey, isMuted, muteRec, snoozeRec, restoreRec, restoreAll,
  loadMuted, getActiveMuted,
} from '../lib/mutedRecommendations';

// TC-MR-01: recKey produces stable key
test('TC-MR-01: recKey produces stable key from type + title', () => {
  expect(recKey('critical', 'Unblock 3 critical items')).toBe('critical:Unblock 3 critical items');
  expect(recKey('warning', 'A'.repeat(80))).toHaveLength('warning:'.length + 60);
});

// TC-MR-02: Not muted initially
test('TC-MR-02: isMuted returns false for unknown key', () => {
  expect(isMuted('critical:some rec')).toBe(false);
});

// TC-MR-03: muteRec → isMuted returns true
test('TC-MR-03: muteRec permanently mutes a recommendation', () => {
  muteRec('critical:Unblock items', 'Unblock items');
  expect(isMuted('critical:Unblock items')).toBe(true);
});

// TC-MR-04: restoreRec unmutes
test('TC-MR-04: restoreRec unmutes a recommendation', () => {
  muteRec('critical:Unblock items', 'Unblock items');
  restoreRec('critical:Unblock items');
  expect(isMuted('critical:Unblock items')).toBe(false);
});

// TC-MR-05: restoreAll clears everything
test('TC-MR-05: restoreAll removes all muted recommendations', () => {
  muteRec('critical:A', 'A');
  muteRec('warning:B', 'B');
  restoreAll();
  expect(loadMuted()).toHaveLength(0);
});

// TC-MR-06: snoozeRec with future date → isMuted returns true
test('TC-MR-06: snoozeRec for 7 days → isMuted true', () => {
  snoozeRec('warning:Stale items', 'Stale items', 7);
  expect(isMuted('warning:Stale items')).toBe(true);
});

// TC-MR-07: Expired snooze → isMuted returns false
test('TC-MR-07: expired snooze is treated as not muted', () => {
  // Manually inject an expired snooze
  store['dc_muted_recs'] = JSON.stringify([{
    key: 'warning:expired',
    label: 'Expired',
    mutedAt: new Date(Date.now() - 86_400_000 * 8).toISOString(),
    until: new Date(Date.now() - 1000).toISOString(), // expired 1 second ago
  }]);
  expect(isMuted('warning:expired')).toBe(false);
});

// TC-MR-08: Multiple mutes tracked independently
test('TC-MR-08: multiple recommendations can be muted independently', () => {
  muteRec('critical:A', 'A');
  muteRec('warning:B', 'B');
  expect(isMuted('critical:A')).toBe(true);
  expect(isMuted('warning:B')).toBe(true);
  expect(isMuted('info:C')).toBe(false);
  expect(loadMuted()).toHaveLength(2);
});

// TC-MR-09: Re-muting same key replaces old entry
test('TC-MR-09: muting same key twice only stores one entry', () => {
  muteRec('critical:X', 'X');
  muteRec('critical:X', 'X');
  expect(loadMuted().filter(m => m.key === 'critical:X')).toHaveLength(1);
});

// TC-MR-10: getActiveMuted prunes expired entries
test('TC-MR-10: getActiveMuted excludes expired snoozes', () => {
  // One valid permanent mute
  muteRec('critical:keep', 'keep');
  // One expired snooze
  store['dc_muted_recs'] = JSON.stringify([
    { key: 'critical:keep', label: 'keep', mutedAt: new Date().toISOString(), until: 'forever' },
    { key: 'warning:expired', label: 'expired', mutedAt: new Date().toISOString(), until: new Date(Date.now() - 1000).toISOString() },
  ]);
  const active = getActiveMuted();
  expect(active.some(m => m.key === 'critical:keep')).toBe(true);
  expect(active.some(m => m.key === 'warning:expired')).toBe(false);
});
