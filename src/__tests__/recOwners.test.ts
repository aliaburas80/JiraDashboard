// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Action-owner assignment tests — TC-AO-01 to TC-AO-08

import { getRecOwner, setRecOwner, clearRecOwner, getAllRecOwners, clearAllRecOwners } from '../lib/recOwners';

// ── Mock localStorage ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    },
    writable: true,
  });
});

// ── TC-AO-01: getRecOwner returns '' when no owner set ────────────────────────

test('TC-AO-01: getRecOwner returns empty string when no owner is set', () => {
  expect(getRecOwner('rec-key-1')).toBe('');
});

// ── TC-AO-02: setRecOwner persists owner ─────────────────────────────────────

test('TC-AO-02: setRecOwner saves owner and getRecOwner retrieves it', () => {
  setRecOwner('rec-key-1', 'Alice');
  expect(getRecOwner('rec-key-1')).toBe('Alice');
});

// ── TC-AO-03: setRecOwner trims whitespace ────────────────────────────────────

test('TC-AO-03: setRecOwner trims leading/trailing whitespace', () => {
  setRecOwner('rec-key-1', '  Bob  ');
  expect(getRecOwner('rec-key-1')).toBe('Bob');
});

// ── TC-AO-04: setRecOwner with empty string removes the key ──────────────────

test('TC-AO-04: setRecOwner with empty string removes the owner entry', () => {
  setRecOwner('rec-key-1', 'Alice');
  setRecOwner('rec-key-1', '');
  expect(getRecOwner('rec-key-1')).toBe('');
});

// ── TC-AO-05: clearRecOwner removes owner ─────────────────────────────────────

test('TC-AO-05: clearRecOwner removes the owner for a specific key', () => {
  setRecOwner('rec-key-1', 'Alice');
  setRecOwner('rec-key-2', 'Bob');
  clearRecOwner('rec-key-1');
  expect(getRecOwner('rec-key-1')).toBe('');
  expect(getRecOwner('rec-key-2')).toBe('Bob'); // untouched
});

// ── TC-AO-06: getAllRecOwners returns all assigned owners ─────────────────────

test('TC-AO-06: getAllRecOwners returns all assigned owners as a map', () => {
  setRecOwner('rec-key-1', 'Alice');
  setRecOwner('rec-key-2', 'Bob');
  const all = getAllRecOwners();
  expect(all['rec-key-1']).toBe('Alice');
  expect(all['rec-key-2']).toBe('Bob');
  expect(Object.keys(all)).toHaveLength(2);
});

// ── TC-AO-07: clearAllRecOwners wipes all owners ─────────────────────────────

test('TC-AO-07: clearAllRecOwners removes all stored owners', () => {
  setRecOwner('rec-key-1', 'Alice');
  setRecOwner('rec-key-2', 'Bob');
  clearAllRecOwners();
  expect(getRecOwner('rec-key-1')).toBe('');
  expect(getRecOwner('rec-key-2')).toBe('');
  expect(Object.keys(getAllRecOwners())).toHaveLength(0);
});

// ── TC-AO-08: setRecOwner overwrites previous owner ──────────────────────────

test('TC-AO-08: setRecOwner overwrites a previously assigned owner', () => {
  setRecOwner('rec-key-1', 'Alice');
  setRecOwner('rec-key-1', 'Carol');
  expect(getRecOwner('rec-key-1')).toBe('Carol');
});
