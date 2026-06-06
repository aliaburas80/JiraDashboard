// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Layout builder tests — TC-LB2-01 to TC-LB2-08

import {
  getDefaultLayout,
  getLayoutPrefs,
  saveLayoutPrefs,
  resetLayoutPrefs,
  getOrderedVisibleSections,
  getHiddenKeys,
  moveUp,
  moveDown,
  toggleVisibility,
} from '../lib/layoutBuilder';
import { DASHBOARD_SECTIONS } from '../lib/dashboardSections';

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

// ── TC-LB2-01: Default layout has all sections visible ────────────────────────

test('TC-LB2-01: getDefaultLayout returns all 14 sections visible', () => {
  const def = getDefaultLayout();
  expect(def).toHaveLength(DASHBOARD_SECTIONS.length);
  def.forEach(p => expect(p.visible).toBe(true));
});

// ── TC-LB2-02: loadLayoutPrefs returns defaults when nothing saved ────────────

test('TC-LB2-02: getLayoutPrefs returns defaults when storage is empty', () => {
  const prefs = getLayoutPrefs();
  expect(prefs).toHaveLength(DASHBOARD_SECTIONS.length);
  prefs.forEach(p => expect(p.visible).toBe(true));
});

// ── TC-LB2-03: save and load round-trip ──────────────────────────────────────

test('TC-LB2-03: saveLayoutPrefs persists and getLayoutPrefs retrieves', () => {
  const custom = getDefaultLayout();
  custom[0].visible = false;
  saveLayoutPrefs(custom);
  const loaded = getLayoutPrefs();
  expect(loaded[0].visible).toBe(false);
  expect(loaded[1].visible).toBe(true);
});

// ── TC-LB2-04: resetLayoutPrefs clears to defaults ───────────────────────────

test('TC-LB2-04: resetLayoutPrefs clears saved settings', () => {
  const custom = getDefaultLayout();
  custom[2].visible = false;
  saveLayoutPrefs(custom);
  resetLayoutPrefs();
  const loaded = getLayoutPrefs();
  expect(loaded[2].visible).toBe(true);
});

// ── TC-LB2-05: moveUp swaps adjacent entries ─────────────────────────────────

test('TC-LB2-05: moveUp swaps the entry with the one above it', () => {
  const prefs = getDefaultLayout();
  const second = prefs[1].key;
  const first  = prefs[0].key;
  const next   = moveUp(prefs, second);
  expect(next[0].key).toBe(second);
  expect(next[1].key).toBe(first);
});

test('TC-LB2-05b: moveUp on first entry is a no-op', () => {
  const prefs = getDefaultLayout();
  const unchanged = moveUp(prefs, prefs[0].key);
  expect(unchanged[0].key).toBe(prefs[0].key);
});

// ── TC-LB2-06: moveDown swaps adjacent entries ───────────────────────────────

test('TC-LB2-06: moveDown swaps the entry with the one below it', () => {
  const prefs = getDefaultLayout();
  const first  = prefs[0].key;
  const second = prefs[1].key;
  const next   = moveDown(prefs, first);
  expect(next[0].key).toBe(second);
  expect(next[1].key).toBe(first);
});

// ── TC-LB2-07: toggleVisibility flips the visible flag ───────────────────────

test('TC-LB2-07: toggleVisibility flips visible flag for one key', () => {
  const prefs = getDefaultLayout();
  const key   = prefs[3].key;
  const toggled = toggleVisibility(prefs, key);
  expect(toggled[3].visible).toBe(false);
  expect(toggled[0].visible).toBe(true); // others unaffected
});

// ── TC-LB2-08: getHiddenKeys and getOrderedVisibleSections ───────────────────

test('TC-LB2-08: getHiddenKeys returns keys with visible=false', () => {
  const prefs   = toggleVisibility(getDefaultLayout(), 'kanban');
  const hidden  = getHiddenKeys(prefs);
  expect(hidden.has('kanban')).toBe(true);
  expect(hidden.has('overview')).toBe(false);

  const ordered = getOrderedVisibleSections(prefs);
  expect(ordered.every(s => s.key !== 'kanban')).toBe(true);
  expect(ordered.length).toBe(DASHBOARD_SECTIONS.length - 1);
});
