// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Advanced theme customizer tests — TC-TC-01 to TC-TC-08

import {
  ACCENT_PRESETS,
  RADIUS_PRESETS,
  FONT_SIZE_PRESETS,
  DEFAULT_THEME,
  loadThemeCustom,
  saveThemeCustom,
  resetThemeCustom,
} from '../lib/themeCustomizer';

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

// ── TC-TC-01: ACCENT_PRESETS has 7 entries, each with hex/hover/shadow ────────

test('TC-TC-01: ACCENT_PRESETS has 7 entries, all with hex, hover, shadow', () => {
  const entries = Object.entries(ACCENT_PRESETS);
  expect(entries).toHaveLength(7);
  entries.forEach(([, p]) => {
    expect(p.hex).toMatch(/^#[0-9a-f]{6}$/i);
    expect(p.hover).toMatch(/^#[0-9a-f]{6}$/i);
    expect(p.shadow).toContain('rgba');
  });
});

// ── TC-TC-02: RADIUS_PRESETS has 3 entries ────────────────────────────────────

test('TC-TC-02: RADIUS_PRESETS has 3 entries: sharp, default, rounded', () => {
  expect(Object.keys(RADIUS_PRESETS)).toEqual(['sharp', 'default', 'rounded']);
  Object.values(RADIUS_PRESETS).forEach(p => {
    expect(p.md).toBeTruthy();
    expect(p.lg).toBeTruthy();
  });
});

// ── TC-TC-03: FONT_SIZE_PRESETS has sm, md, lg ───────────────────────────────

test('TC-TC-03: FONT_SIZE_PRESETS has sm, md, lg with px values', () => {
  expect(Object.keys(FONT_SIZE_PRESETS)).toEqual(['sm', 'md', 'lg']);
  Object.values(FONT_SIZE_PRESETS).forEach(p => {
    expect(p.px).toMatch(/^\d+px$/);
  });
});

// ── TC-TC-04: loadThemeCustom returns DEFAULT_THEME when nothing saved ────────

test('TC-TC-04: loadThemeCustom returns defaults when storage is empty', () => {
  const result = loadThemeCustom();
  expect(result).toEqual(DEFAULT_THEME);
  expect(result.accent).toBe('blue');
  expect(result.radius).toBe('default');
  expect(result.fontSize).toBe('md');
});

// ── TC-TC-05: saveThemeCustom persists and loadThemeCustom retrieves ──────────

test('TC-TC-05: saveThemeCustom persists settings and loadThemeCustom reads them', () => {
  saveThemeCustom({ accent: 'purple', radius: 'rounded', fontSize: 'lg' });
  const loaded = loadThemeCustom();
  expect(loaded.accent).toBe('purple');
  expect(loaded.radius).toBe('rounded');
  expect(loaded.fontSize).toBe('lg');
});

// ── TC-TC-06: resetThemeCustom clears storage ─────────────────────────────────

test('TC-TC-06: resetThemeCustom clears saved settings', () => {
  saveThemeCustom({ accent: 'teal', radius: 'sharp', fontSize: 'sm' });
  resetThemeCustom();
  const loaded = loadThemeCustom();
  expect(loaded).toEqual(DEFAULT_THEME);
});

// ── TC-TC-07: loadThemeCustom falls back to default for unknown values ─────────

test('TC-TC-07: loadThemeCustom uses defaults for invalid stored values', () => {
  store['dc_theme_custom'] = JSON.stringify({ accent: 'invalid', radius: 'bad', fontSize: 'x' });
  const loaded = loadThemeCustom();
  expect(loaded.accent).toBe(DEFAULT_THEME.accent);
  expect(loaded.radius).toBe(DEFAULT_THEME.radius);
  expect(loaded.fontSize).toBe(DEFAULT_THEME.fontSize);
});

// ── TC-TC-08: DEFAULT_THEME accent is blue ───────────────────────────────────

test('TC-TC-08: DEFAULT_THEME uses blue accent, default radius, md font', () => {
  expect(DEFAULT_THEME.accent).toBe('blue');
  expect(DEFAULT_THEME.radius).toBe('default');
  expect(DEFAULT_THEME.fontSize).toBe('md');
  expect(ACCENT_PRESETS.blue.hex).toBe('#2563eb');
});
