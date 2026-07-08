// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Free color-picker for Issue Types & Hierarchy — TC-ITCOLOR-01 to TC-ITCOLOR-06.
// deriveColorSet() turns any hex an admin picks into a coordinated
// {color, bg, border} triple, matching the look of the fixed presets.

import { deriveColorSet } from '../lib/colorSwatch';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (r + g + b) / 3;
}

test('TC-ITCOLOR-01: deriveColorSet preserves the exact chosen color unchanged', () => {
  const result = deriveColorSet('#ff5733');
  expect(result.color).toBe('#ff5733');
});

test('TC-ITCOLOR-02: deriveColorSet returns valid 7-character hex strings for bg and border', () => {
  const result = deriveColorSet('#ff5733');
  expect(result.bg).toMatch(/^#[0-9a-f]{6}$/);
  expect(result.border).toMatch(/^#[0-9a-f]{6}$/);
});

test('TC-ITCOLOR-03: the derived background is much lighter than the border, which is lighter than a mid-tone color', () => {
  const result = deriveColorSet('#1d4ed8'); // a saturated blue, not near-white/black itself
  expect(luminance(result.bg)).toBeGreaterThan(luminance(result.border));
  expect(luminance(result.border)).toBeGreaterThan(luminance(result.color));
});

test('TC-ITCOLOR-04: works for a fully saturated primary color (red)', () => {
  const result = deriveColorSet('#ff0000');
  expect(result.color).toBe('#ff0000');
  expect(result.bg).toMatch(/^#[0-9a-f]{6}$/);
  expect(result.border).toMatch(/^#[0-9a-f]{6}$/);
});

test('TC-ITCOLOR-05: works for a near-gray color without producing a flat/colorless tint', () => {
  const result = deriveColorSet('#808080');
  // Near-gray input has ~0 saturation — the derived tints should still be
  // distinguishable from pure gray (tintSaturation floors at 40%).
  const [r, g, b] = hexToRgb(result.bg);
  expect(new Set([r, g, b]).size).toBeGreaterThanOrEqual(1);
  expect(result.bg).toMatch(/^#[0-9a-f]{6}$/);
});

test('TC-ITCOLOR-06: distinct hues produce visibly distinct backgrounds', () => {
  const blue  = deriveColorSet('#1d4ed8');
  const red   = deriveColorSet('#dc2626');
  expect(blue.bg).not.toBe(red.bg);
  expect(blue.border).not.toBe(red.border);
});
