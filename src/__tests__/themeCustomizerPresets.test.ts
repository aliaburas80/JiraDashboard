// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// New "mediterranean" light palette preset + the mode-driven dark-class fix
// in applyThemeCustom()/initThemeCustom() — TC-TCP-01 to TC-TCP-08.
//
// Previously, applyThemeCustom() branched on "is the palette 'none'" to
// decide whether to add the `.dark` class — correct only because every
// non-'none' preset used to be dark. Adding the first light non-'none'
// preset (mediterranean) exposed that assumption; these tests pin the
// corrected `mode`-driven behavior so it can't regress silently.

import {
  PALETTE_PRESETS,
  applyThemeCustom,
  initThemeCustom,
  DEFAULT_THEME,
  type ThemeCustom,
} from '../lib/themeCustomizer';

function makeFakeRoot() {
  const classes = new Set<string>();
  const attrs: Record<string, string> = {};
  const styleProps: Record<string, string> = {};
  return {
    classList: {
      add:    (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
      contains: (c: string) => classes.has(c),
    },
    setAttribute:    (k: string, v: string) => { attrs[k] = v; },
    removeAttribute: (k: string) => { delete attrs[k]; },
    style: {
      setProperty: (k: string, v: string) => { styleProps[k] = v; },
      get fontSize() { return styleProps.fontSize ?? ''; },
      set fontSize(v: string) { styleProps.fontSize = v; },
    },
    _classes: classes,
    _attrs: attrs,
    _styleProps: styleProps,
  };
}

let fakeRoot: ReturnType<typeof makeFakeRoot>;
const lsStore: Record<string, string> = {};

beforeEach(() => {
  fakeRoot = makeFakeRoot();
  Object.keys(lsStore).forEach(k => delete lsStore[k]);
  Object.defineProperty(global, 'document', {
    value: { documentElement: fakeRoot },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: (k: string) => lsStore[k] ?? null,
      setItem: (k: string, v: string) => { lsStore[k] = v; },
      removeItem: (k: string) => { delete lsStore[k]; },
    },
    writable: true,
    configurable: true,
  });
});

test('TC-TCP-01: mediterranean preset exists and is mode: light', () => {
  expect(PALETTE_PRESETS.mediterranean).toBeDefined();
  expect(PALETTE_PRESETS.mediterranean.mode).toBe('light');
});

test('TC-TCP-02: every legacy palette (gold/copper/sage/orange) is still mode: dark', () => {
  expect(PALETTE_PRESETS.gold.mode).toBe('dark');
  expect(PALETTE_PRESETS.copper.mode).toBe('dark');
  expect(PALETTE_PRESETS.sage.mode).toBe('dark');
  expect(PALETTE_PRESETS.orange.mode).toBe('dark');
});

test('TC-TCP-03: none is mode: light', () => {
  expect(PALETTE_PRESETS.none.mode).toBe('light');
});

test('TC-TCP-04: applying the mediterranean preset does not add the dark class', () => {
  const settings: ThemeCustom = { ...DEFAULT_THEME, palette: 'mediterranean' };
  applyThemeCustom(settings);

  expect(fakeRoot._classes.has('dark')).toBe(false);
  expect(fakeRoot._styleProps['--dc-bg']).toBe(PALETTE_PRESETS.mediterranean.bg);
  expect(fakeRoot._styleProps['--dc-accent']).toBe(PALETTE_PRESETS.mediterranean.acc);
});

test('TC-TCP-05: applying a dark preset (gold) adds the dark class', () => {
  const settings: ThemeCustom = { ...DEFAULT_THEME, palette: 'gold' };
  applyThemeCustom(settings);

  expect(fakeRoot._classes.has('dark')).toBe(true);
});

test('TC-TCP-06: switching from a dark preset back to none removes the dark class (regression — previously stuck applied)', () => {
  applyThemeCustom({ ...DEFAULT_THEME, palette: 'gold' });
  expect(fakeRoot._classes.has('dark')).toBe(true);

  applyThemeCustom({ ...DEFAULT_THEME, palette: 'none' });
  expect(fakeRoot._classes.has('dark')).toBe(false);
});

test('TC-TCP-07: switching from a dark preset to mediterranean removes the dark class', () => {
  applyThemeCustom({ ...DEFAULT_THEME, palette: 'gold' });
  expect(fakeRoot._classes.has('dark')).toBe(true);

  applyThemeCustom({ ...DEFAULT_THEME, palette: 'mediterranean' });
  expect(fakeRoot._classes.has('dark')).toBe(false);
});

test('TC-TCP-08: initThemeCustom coerces a stored dark palette to none, but leaves mediterranean untouched', () => {
  lsStore['dc_theme_custom'] = JSON.stringify({ ...DEFAULT_THEME, palette: 'gold' });
  const goldResult = initThemeCustom();
  expect(goldResult.palette).toBe('none');

  lsStore['dc_theme_custom'] = JSON.stringify({ ...DEFAULT_THEME, palette: 'mediterranean' });
  const medResult = initThemeCustom();
  expect(medResult.palette).toBe('mediterranean');
});
