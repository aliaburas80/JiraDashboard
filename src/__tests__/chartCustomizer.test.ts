// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Chart customizer tests — TC-CC-01 to TC-CC-08

import {
  CHART_REGISTRY,
  getDefaultChartPrefs,
  getChartPrefs,
  saveChartPrefs,
  resetChartPrefs,
  isDefaultChartPrefs,
  chartMoveUp,
  chartMoveDown,
  chartToggleVisible,
  chartSetSpan,
} from '../lib/chartCustomizer';

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

// ── TC-CC-01: CHART_REGISTRY has 11 entries ───────────────────────────────────

test('TC-CC-01: CHART_REGISTRY has 11 entries each with id, label, icon, defaultSpan', () => {
  expect(CHART_REGISTRY).toHaveLength(11);
  CHART_REGISTRY.forEach(c => {
    expect(typeof c.id).toBe('string');
    expect(c.label.length).toBeGreaterThan(0);
    expect([1, 2, 3]).toContain(c.defaultSpan);
  });
});

// ── TC-CC-02: getDefaultChartPrefs returns all visible ───────────────────────

test('TC-CC-02: getDefaultChartPrefs returns 11 prefs all visible with correct spans', () => {
  const def = getDefaultChartPrefs();
  expect(def).toHaveLength(11);
  def.forEach((p, i) => {
    expect(p.visible).toBe(true);
    expect(p.span).toBe(CHART_REGISTRY[i].defaultSpan);
  });
});

// ── TC-CC-03: getChartPrefs returns defaults when nothing saved ───────────────

test('TC-CC-03: getChartPrefs returns defaults when storage is empty', () => {
  const prefs = getChartPrefs();
  expect(isDefaultChartPrefs(prefs)).toBe(true);
});

// ── TC-CC-04: save and load round-trip ───────────────────────────────────────

test('TC-CC-04: saveChartPrefs persists and getChartPrefs retrieves', () => {
  const custom = getDefaultChartPrefs();
  custom[0].visible = false;
  custom[1].span = 3;
  saveChartPrefs(custom);
  const loaded = getChartPrefs();
  expect(loaded[0].visible).toBe(false);
  expect(loaded[1].span).toBe(3);
});

// ── TC-CC-05: resetChartPrefs clears to defaults ─────────────────────────────

test('TC-CC-05: resetChartPrefs clears to defaults', () => {
  const custom = getDefaultChartPrefs();
  custom[3].visible = false;
  saveChartPrefs(custom);
  resetChartPrefs();
  expect(isDefaultChartPrefs(getChartPrefs())).toBe(true);
});

// ── TC-CC-06: chartMoveUp / chartMoveDown ─────────────────────────────────────

test('TC-CC-06: chartMoveUp swaps entry with one above; no-op at index 0', () => {
  const prefs  = getDefaultChartPrefs();
  const id1    = prefs[0].id;
  const id2    = prefs[1].id;
  const moved  = chartMoveUp(prefs, id2);
  expect(moved[0].id).toBe(id2);
  expect(moved[1].id).toBe(id1);
  // no-op at index 0
  const same = chartMoveUp(prefs, id1);
  expect(same[0].id).toBe(id1);
});

test('TC-CC-06b: chartMoveDown swaps entry with one below', () => {
  const prefs  = getDefaultChartPrefs();
  const id0    = prefs[0].id;
  const id1    = prefs[1].id;
  const moved  = chartMoveDown(prefs, id0);
  expect(moved[0].id).toBe(id1);
  expect(moved[1].id).toBe(id0);
});

// ── TC-CC-07: chartToggleVisible and chartSetSpan ────────────────────────────

test('TC-CC-07: chartToggleVisible flips one entry; chartSetSpan changes span', () => {
  const prefs   = getDefaultChartPrefs();
  const id      = prefs[2].id;
  const toggled = chartToggleVisible(prefs, id);
  expect(toggled[2].visible).toBe(false);
  expect(toggled[0].visible).toBe(true);

  const spanned = chartSetSpan(prefs, id, 3);
  expect(spanned[2].span).toBe(3);
  expect(spanned[0].span).toBe(prefs[0].span); // others unchanged
});

// ── TC-CC-08: isDefaultChartPrefs detects non-default ────────────────────────

test('TC-CC-08: isDefaultChartPrefs returns false when visibility or span changed', () => {
  expect(isDefaultChartPrefs(getDefaultChartPrefs())).toBe(true);
  const vis   = chartToggleVisible(getDefaultChartPrefs(), 'health');
  expect(isDefaultChartPrefs(vis)).toBe(false);
  const span  = chartSetSpan(getDefaultChartPrefs(), 'delivery', 1);
  expect(isDefaultChartPrefs(span)).toBe(false);
});
