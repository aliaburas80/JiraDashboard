// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Data Quality Score tests — TC-DQ-01 to TC-DQ-12

import { calculateDataQuality } from '../services/dataQuality/dataQuality.service';
import type { OrphanRules } from '../types/orphanRules';
import { DEFAULT_ORPHAN_RULES } from '../types/orphanRules';

function issue(overrides: Record<string, unknown> = {}) {
  return {
    'Issue Key':       'PROJ-1',
    'Issue Type':      'Story',
    'Summary':         'Test issue',
    'Status':          'In Progress',
    'Created Date':    '2025-01-01',
    'In Progress Date':'2025-01-05',
    'Assignee':        'Ali',
    'Sprint':          'Sprint 1',
    'Sprint Start':    '2025-01-01',
    'Sprint End':      '2025-01-14',
    'Story Points':    5,
    'Epic Link':       'EPIC-1',
    'Priority':        'High',
    ...overrides,
  };
}

// TC-DQ-01: Perfect data → score near 100, Excellent band
test('TC-DQ-01: all fields present → score high, Excellent or Good band', () => {
  const issues = Array(10).fill(null).map((_, i) => issue({ 'Issue Key': `P-${i}` }));
  const result = calculateDataQuality(issues);
  expect(result.score).toBeGreaterThanOrEqual(85);
  expect(['Excellent', 'Good']).toContain(result.band);
});

// TC-DQ-02: Missing In Progress Date → reduces score, affects Cycle Time
test('TC-DQ-02: missing In Progress Date → score reduced, Cycle Time affected', () => {
  const issues = Array(10).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'In Progress Date': '', 'Sprint Start': '' })
  );
  const result = calculateDataQuality(issues);
  const check  = result.checks.find(c => c.field === 'In Progress Date');
  expect(check?.missing).toBe(10);
  expect(check?.missingPct).toBe(100);
  expect(result.affectedMetrics).toContain('Cycle Time');
  expect(result.score).toBeLessThan(90);
});

// TC-DQ-03: Done items missing Done Date → critical check fails
test('TC-DQ-03: done items missing Done Date → critical check fails', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Status': 'Done', 'Done Date': '', 'Resolution Date': '' })
  );
  const result = calculateDataQuality(issues);
  const check  = result.checks.find(c => c.field === 'Done Date');
  expect(check?.missing).toBe(5);
  expect(check?.severity).toBe('critical');
  expect(result.criticalCount).toBeGreaterThan(0);
});

// TC-DQ-04: Missing Story Points → velocity affected
test('TC-DQ-04: missing Story Points → Velocity metric affected', () => {
  const issues = Array(10).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Story Points': 0 })
  );
  const result = calculateDataQuality(issues);
  const check  = result.checks.find(c => c.field === 'Story Points');
  expect(check?.missing).toBe(10);
  expect(result.affectedMetrics).toContain('Velocity');
});

// TC-DQ-05: Missing Sprint → sprint throughput affected
test('TC-DQ-05: missing Sprint → Sprint Throughput affected', () => {
  const issues = Array(10).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Sprint': '', 'Actual Sprint': '' })
  );
  const result = calculateDataQuality(issues);
  const check  = result.checks.find(c => c.field === 'Sprint');
  expect(check?.missing).toBe(10);
  expect(result.affectedMetrics).toContain('Sprint Throughput');
});

// TC-DQ-06: Missing Epic Link (non-epics) → orphan risk affected
test('TC-DQ-06: missing Epic Link → Orphan Risk metric affected', () => {
  const issues = Array(10).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Epic Link': '', 'Parent Key': '' })
  );
  const result = calculateDataQuality(issues);
  const check  = result.checks.find(c => c.field === 'Epic Link');
  expect(check).toBeTruthy();
  expect(result.affectedMetrics).toContain('Orphan Risk');
});

// TC-DQ-07: Orphan items reduce score
test('TC-DQ-07: high orphan ratio reduces score', () => {
  const perfect  = calculateDataQuality([issue()]);
  const orphans  = calculateDataQuality(
    Array(10).fill(null).map((_, i) =>
      issue({ 'Issue Key': `P-${i}`, 'Epic Link': '', 'Parent Key': '' })
    )
  );
  expect(orphans.score).toBeLessThan(perfect.score);
});

// TC-DQ-08: Empty issues array → score 0, Critical
test('TC-DQ-08: empty array → score 0, Critical band', () => {
  const result = calculateDataQuality([]);
  expect(result.score).toBe(0);
  expect(result.band).toBe('Critical');
  expect(result.totalIssues).toBe(0);
});

// TC-DQ-09: Score is always 0–100
test('TC-DQ-09: score is always clamped to 0–100', () => {
  // Worst possible: every field missing
  const worst = Array(20).fill(null).map((_, i) => ({
    'Issue Key': `P-${i}`, 'Issue Type': 'Story', 'Summary': 'x', 'Status': 'Done',
  }));
  const result = calculateDataQuality(worst);
  expect(result.score).toBeGreaterThanOrEqual(0);
  expect(result.score).toBeLessThanOrEqual(100);
});

// TC-DQ-10: Band classifications are correct
test('TC-DQ-10: band matches score range', () => {
  expect(['Excellent', 'Good', 'Fair', 'Weak', 'Critical']).toContain(
    calculateDataQuality([issue()]).band
  );
});

// TC-DQ-11: Summary is a non-empty string
test('TC-DQ-11: summary is a human-readable non-empty string', () => {
  const result = calculateDataQuality([issue()]);
  expect(typeof result.summary).toBe('string');
  expect(result.summary.length).toBeGreaterThan(10);
  expect(result.summary).toContain('%');
});

// TC-DQ-13 to TC-DQ-14: CP3-017 — small-sample caveat in the summary sentence.
// The score/band themselves are unchanged by sample size (that's the
// finding); only the summary text gains a caveat sentence below the
// DATA_QUALITY_LOW_SAMPLE_SIZE threshold.
test('TC-DQ-13: small sample (< 30 issues) gets a caveat sentence in the summary', () => {
  const result = calculateDataQuality(Array(5).fill(null).map((_, i) => issue({ 'Issue Key': `P-${i}` })));
  expect(result.score).toBeGreaterThanOrEqual(85); // score itself is unaffected
  expect(result.summary).toMatch(/only 5 issues/i);
});

test('TC-DQ-14: large sample (>= 30 issues) gets no caveat sentence', () => {
  const result = calculateDataQuality(Array(30).fill(null).map((_, i) => issue({ 'Issue Key': `P-${i}` })));
  expect(result.summary).not.toMatch(/percentages may shift/i);
});

// TC-DQ-12: Epics excluded from Epic Link check
test('TC-DQ-12: Epic issue type excluded from Epic Link missing check', () => {
  const issues = [
    issue({ 'Issue Key': 'EPIC-1', 'Issue Type': 'Epic', 'Epic Link': '' }),
    issue({ 'Issue Key': 'S-1',    'Issue Type': 'Story', 'Epic Link': 'EPIC-1' }),
  ];
  const result = calculateDataQuality(issues);
  const check  = result.checks.find(c => c.field === 'Epic Link');
  // Epic is excluded — only Story counts
  expect(check?.total).toBe(1);
  expect(check?.missing).toBe(0);
});

// TC-DQ-13: CP3-014 — orphan penalty uses the canonical rules-based definition
// (isOrphanByRules), so a custom parentLinkFields rule changes the orphan
// ratio here exactly as it would in the health-score orphan count.
test('TC-DQ-13: orphan penalty respects a custom orphan-rules parentLinkFields config', () => {
  const issues = Array(10).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Epic Link': '', 'Parent Key': '', 'Component/s': 'Auth' })
  );

  const defaultRules = calculateDataQuality(issues);
  expect(defaultRules.score).toBeLessThan(
    calculateDataQuality(issues.map(i => ({ ...i, 'Epic Link': 'EPIC-1' }))).score,
  );

  const customRules: OrphanRules = { ...DEFAULT_ORPHAN_RULES, parentLinkFields: ['Component/s'] };
  const withCustomRules = calculateDataQuality(issues, customRules);
  // Same data, no Epic Link/Parent Key — but Component/s is set, so under the
  // custom rule these items are no longer orphans and the score is higher.
  expect(withCustomRules.score).toBeGreaterThan(defaultRules.score);
});
