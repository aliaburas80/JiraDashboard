// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Dashboard section-trigger status chip tests — TC-CH-01 to TC-CH-03

import { CHIP_CLS, chipClass, mostSevereChipType, type Chip } from '../lib/dashboardChips';

// TC-CH-01: every chip type maps to a distinct, defined style class
test('TC-CH-01: each of the 5 chip tiers maps to a distinct style class', () => {
  const types: Array<keyof typeof CHIP_CLS> = ['good', 'warning', 'critical', 'info', 'neutral'];
  const classes = types.map(t => CHIP_CLS[t]);
  expect(new Set(classes).size).toBe(types.length);
  for (const t of types) {
    expect(chipClass(t)).toBe(CHIP_CLS[t]);
  }
});

// TC-CH-02: an unspecified chip type falls back to the neutral style
test('TC-CH-02: chipClass falls back to neutral for an undefined type', () => {
  expect(chipClass(undefined)).toBe(CHIP_CLS.neutral);
});

// TC-CH-03: the most severe chip in a section's badge list determines the section's at-a-glance summary tier
test('TC-CH-03: mostSevereChipType picks critical over warning, info, good and neutral', () => {
  const chips: Chip[] = [
    { label: '2 healthy', type: 'good' },
    { label: '1 needs attention', type: 'warning' },
    { label: '1 blocked', type: 'critical' },
    { label: 'updated 2h ago', type: 'info' },
  ];
  expect(mostSevereChipType(chips)).toBe('critical');
  expect(mostSevereChipType(chips.filter(c => c.type !== 'critical'))).toBe('warning');
  expect(mostSevereChipType([{ label: 'no data' }])).toBe('neutral');
  expect(mostSevereChipType([])).toBe('neutral');
});
