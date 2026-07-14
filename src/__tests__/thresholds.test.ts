// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Health threshold tests — TC-TH-01 to TC-TH-10

import { DEFAULT_THRESHOLDS, THRESHOLD_LABELS } from '../types/thresholds';
import type { HealthThresholds } from '../types/thresholds';

// ── Validation logic ──────────────────────────────────────────────────────────

function validateThresholds(t: Partial<HealthThresholds>): string | null {
  if (t.cycleTimeWarningDays && t.cycleTimeCriticalDays && t.cycleTimeWarningDays >= t.cycleTimeCriticalDays)
    return 'Cycle time warning must be less than critical.';
  if (t.activeAgeWarningDays && t.activeAgeCriticalDays && t.activeAgeWarningDays >= t.activeAgeCriticalDays)
    return 'Active age warning must be less than critical.';
  if (t.blockedRatioWarningPct && t.blockedRatioCriticalPct && t.blockedRatioWarningPct >= t.blockedRatioCriticalPct)
    return 'Blocked ratio warning must be less than critical.';
  return null;
}

// ── Health computation with thresholds ────────────────────────────────────────

function getHealth(cycleTimeDays: number | null, activeAgeDays: number | null, ageDays: number | null, t: HealthThresholds): string {
  if (cycleTimeDays !== null) {
    if (cycleTimeDays > t.cycleTimeCriticalDays) return 'critical';
    if (cycleTimeDays > t.cycleTimeWarningDays)  return 'warning';
    return 'good';
  }
  if (activeAgeDays !== null) {
    if (activeAgeDays > t.activeAgeCriticalDays) return 'critical';
    if (activeAgeDays > t.activeAgeWarningDays)  return 'warning';
    return 'good';
  }
  if (ageDays !== null && ageDays > t.openAgeWarningDays) return 'warning';
  return 'good';
}

// TC-TH-01: Default thresholds have correct values
test('TC-TH-01: DEFAULT_THRESHOLDS has expected values', () => {
  expect(DEFAULT_THRESHOLDS.cycleTimeWarningDays).toBe(7);
  expect(DEFAULT_THRESHOLDS.cycleTimeCriticalDays).toBe(14);
  expect(DEFAULT_THRESHOLDS.activeAgeWarningDays).toBe(7);
  expect(DEFAULT_THRESHOLDS.activeAgeCriticalDays).toBe(14);
  expect(DEFAULT_THRESHOLDS.openAgeWarningDays).toBe(30);
  expect(DEFAULT_THRESHOLDS.blockedRatioWarningPct).toBe(10);
  expect(DEFAULT_THRESHOLDS.blockedRatioCriticalPct).toBe(20);
  expect(DEFAULT_THRESHOLDS.healthScoreExcellentPct).toBe(90);
  expect(DEFAULT_THRESHOLDS.healthScoreGoodPct).toBe(75);
  expect(DEFAULT_THRESHOLDS.healthScoreFairPct).toBe(60);
  expect(DEFAULT_THRESHOLDS.healthScoreWeakPct).toBe(40);
});

// TC-TH-02: Cycle time above critical threshold → critical health
test('TC-TH-02: cycle time > critical threshold → critical', () => {
  expect(getHealth(20, null, null, DEFAULT_THRESHOLDS)).toBe('critical');
});

// TC-TH-03: Cycle time between warning and critical → warning
test('TC-TH-03: cycle time > warning but < critical → warning', () => {
  expect(getHealth(10, null, null, DEFAULT_THRESHOLDS)).toBe('warning');
});

// TC-TH-04: Cycle time below warning → good
test('TC-TH-04: cycle time < warning threshold → good', () => {
  expect(getHealth(5, null, null, DEFAULT_THRESHOLDS)).toBe('good');
});

// TC-TH-05: Custom thresholds change health classification
test('TC-TH-05: custom thresholds change health result', () => {
  const custom = { ...DEFAULT_THRESHOLDS, cycleTimeWarningDays: 3, cycleTimeCriticalDays: 5 };
  expect(getHealth(4, null, null, custom)).toBe('warning');   // 4 > 3 but < 5
  expect(getHealth(6, null, null, custom)).toBe('critical');  // 6 > 5
  // Same values with defaults would be 'good'
  expect(getHealth(4, null, null, DEFAULT_THRESHOLDS)).toBe('good');
});

// TC-TH-06: Open item age threshold
test('TC-TH-06: open item age > openAgeWarningDays → warning', () => {
  expect(getHealth(null, null, 35, DEFAULT_THRESHOLDS)).toBe('warning');
  expect(getHealth(null, null, 20, DEFAULT_THRESHOLDS)).toBe('good');
});

// TC-TH-07: Validation — warning < critical required
test('TC-TH-07: validation rejects warning >= critical', () => {
  expect(validateThresholds({ cycleTimeWarningDays: 14, cycleTimeCriticalDays: 7 })).not.toBeNull();
  expect(validateThresholds({ cycleTimeWarningDays: 14, cycleTimeCriticalDays: 14 })).not.toBeNull();
  expect(validateThresholds({ cycleTimeWarningDays: 7, cycleTimeCriticalDays: 14 })).toBeNull();
});

// TC-TH-08: Active age thresholds
test('TC-TH-08: active age thresholds work correctly', () => {
  expect(getHealth(null, 20, null, DEFAULT_THRESHOLDS)).toBe('critical'); // > 14
  expect(getHealth(null, 10, null, DEFAULT_THRESHOLDS)).toBe('warning');  // > 7
  expect(getHealth(null, 5,  null, DEFAULT_THRESHOLDS)).toBe('good');     // < 7
});

// TC-TH-09: THRESHOLD_LABELS covers all configurable fields
test('TC-TH-09: THRESHOLD_LABELS covers all 13 configurable threshold fields', () => {
  const keys = Object.keys(THRESHOLD_LABELS);
  expect(keys).toHaveLength(13);
  expect(keys).toContain('cycleTimeWarningDays');
  expect(keys).toContain('blockedRatioCriticalPct');
  expect(keys).toContain('healthScoreExcellentPct');
  expect(keys).toContain('healthScoreWeakPct');
});

// TC-TH-10: Each threshold label has min/max/unit/description
test('TC-TH-10: every threshold label entry has required fields', () => {
  Object.values(THRESHOLD_LABELS).forEach(cfg => {
    expect(cfg.label.length).toBeGreaterThan(0);
    expect(cfg.unit.length).toBeGreaterThan(0);
    expect(cfg.description.length).toBeGreaterThan(0);
    expect(cfg.min).toBeGreaterThanOrEqual(0);
    expect(cfg.max).toBeGreaterThan(cfg.min);
  });
});
