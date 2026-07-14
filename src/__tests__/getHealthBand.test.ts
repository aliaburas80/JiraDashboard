// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// CP3-018 — getHealthBand tests, TC-HB-01 to TC-HB-08

import { getHealthBand } from '../lib/utils';
import { DEFAULT_THRESHOLDS } from '../types/thresholds';
import type { HealthThresholds } from '../types/thresholds';

// TC-HB-01 to TC-HB-05: default cutoffs (90/75/60/40)
test('TC-HB-01: score >= 90 is excellent by default', () => {
  expect(getHealthBand(90)).toBe('excellent');
  expect(getHealthBand(100)).toBe('excellent');
});

test('TC-HB-02: score 75-89 is good by default', () => {
  expect(getHealthBand(75)).toBe('good');
  expect(getHealthBand(89)).toBe('good');
});

test('TC-HB-03: score 60-74 is moderate by default', () => {
  expect(getHealthBand(60)).toBe('moderate');
  expect(getHealthBand(74)).toBe('moderate');
});

test('TC-HB-04: score 40-59 is at-risk by default', () => {
  expect(getHealthBand(40)).toBe('at-risk');
  expect(getHealthBand(59)).toBe('at-risk');
});

test('TC-HB-05: score below 40 is critical by default', () => {
  expect(getHealthBand(39)).toBe('critical');
  expect(getHealthBand(0)).toBe('critical');
});

// TC-HB-06 to TC-HB-08: custom (admin-configured) cutoffs change the result
test('TC-HB-06: custom thresholds reclassify a score that was "good" under defaults', () => {
  const custom: HealthThresholds = { ...DEFAULT_THRESHOLDS, healthScoreExcellentPct: 80 };
  expect(getHealthBand(85, DEFAULT_THRESHOLDS)).toBe('good');
  expect(getHealthBand(85, custom)).toBe('excellent');
});

test('TC-HB-07: custom thresholds reclassify a score that was "at-risk" under defaults', () => {
  const custom: HealthThresholds = { ...DEFAULT_THRESHOLDS, healthScoreWeakPct: 50 };
  expect(getHealthBand(45, DEFAULT_THRESHOLDS)).toBe('at-risk');
  expect(getHealthBand(45, custom)).toBe('critical');
});

test('TC-HB-08: DEFAULT_THRESHOLDS is used when no thresholds argument is passed', () => {
  expect(getHealthBand(95)).toBe(getHealthBand(95, DEFAULT_THRESHOLDS));
});
