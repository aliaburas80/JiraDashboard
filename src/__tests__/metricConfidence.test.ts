// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Metric Confidence Score tests — TC-MC-01 to TC-MC-14

import { calculateMetricConfidence } from '../services/metrics/metricConfidence.service';

function issue(overrides: Record<string, unknown> = {}) {
  return {
    'Issue Key':        'P-1',
    'Issue Type':       'Story',
    'Summary':          'Test',
    'Status':           'In Progress',
    'Created Date':     '2025-01-01',
    'In Progress Date': '2025-01-05',
    'Done Date':        '',
    'Story Points':     5,
    'Sprint':           'Sprint 1',
    'Sprint Start':     '2025-01-01',
    'Sprint End':       '2025-01-14',
    'Epic Link':        'EPIC-1',
    'Assignee':         'Ali',
    'Fix Version/s':    'v1.0',
    'Priority':         'High',
    ...overrides,
  };
}

function doneIssue(overrides: Record<string, unknown> = {}) {
  return issue({ Status: 'Done', 'Done Date': '2025-01-10', ...overrides });
}

// TC-MC-01: All fields present → all metrics High confidence
test('TC-MC-01: perfect data → all key metrics have High confidence', () => {
  const issues = [doneIssue(), doneIssue({ 'Issue Key': 'P-2' })];
  const result = calculateMetricConfidence(issues);
  expect(result.leadTime.band).toBe('High');
  expect(result.cycleTime.band).toBe('High');
  expect(result.storyPoints.band).toBe('High');
});

// TC-MC-02: Lead Time — missing Done Date on done items → Low confidence
test('TC-MC-02: done items missing Done Date → lead time Low or Unreliable', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    doneIssue({ 'Issue Key': `P-${i}`, 'Done Date': '', 'Resolution Date': '' })
  );
  const result = calculateMetricConfidence(issues);
  expect(result.leadTime.confidence).toBe(0);
  expect(['Low', 'Unreliable']).toContain(result.leadTime.band);
  expect(result.leadTime.missingFields).toContain('Done Date');
});

// TC-MC-03: Cycle Time — missing In Progress Date → Low confidence
test('TC-MC-03: missing In Progress Date → cycle time low confidence', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    doneIssue({ 'Issue Key': `P-${i}`, 'In Progress Date': '', 'Sprint Start': '' })
  );
  const result = calculateMetricConfidence(issues);
  expect(result.cycleTime.confidence).toBeLessThan(50);
  expect(result.cycleTime.missingFields).toContain('In Progress Date');
});

// TC-MC-04: Sprint Throughput — no Sprint field → Unreliable
test('TC-MC-04: no sprint field → sprint throughput Unreliable', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Sprint': '', 'Actual Sprint': '' })
  );
  const result = calculateMetricConfidence(issues);
  expect(result.sprintThroughput.confidence).toBeLessThan(40);
  expect(['Low', 'Unreliable', 'N/A']).toContain(result.sprintThroughput.band);
});

// TC-MC-05: Story Points — all zero → Unreliable
test('TC-MC-05: all story points zero → Unreliable confidence', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Story Points': 0 })
  );
  const result = calculateMetricConfidence(issues);
  expect(result.storyPoints.confidence).toBe(0);
  expect(result.storyPoints.band).toBe('Unreliable');
});

// TC-MC-06: No completed items → lead time and cycle time N/A
test('TC-MC-06: no done items → lead time and cycle time N/A', () => {
  const issues = [issue(), issue({ 'Issue Key': 'P-2' })];
  const result = calculateMetricConfidence(issues);
  expect(result.leadTime.band).toBe('N/A');
  expect(result.cycleTime.band).toBe('N/A');
});

// TC-MC-07: Kanban — non-sprint done items with Done Date → High confidence
test('TC-MC-07: kanban items with Done Date → High confidence', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    doneIssue({ 'Issue Key': `K-${i}`, 'Sprint': '', 'Actual Sprint': '' })
  );
  const result = calculateMetricConfidence(issues);
  expect(result.kanbanFlow.band).toBe('High');
});

// TC-MC-08: Team capacity — all unassigned → Unreliable
test('TC-MC-08: all unassigned → team capacity Unreliable', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Assignee': 'Unassigned' })
  );
  const result = calculateMetricConfidence(issues);
  expect(result.teamCapacity.confidence).toBe(0);
});

// TC-MC-09: Release Readiness — no Fix Version → Low/Unreliable
test('TC-MC-09: missing Fix Version → release readiness low', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Fix Version/s': '' })
  );
  const result = calculateMetricConfidence(issues);
  expect(result.releaseReadiness.confidence).toBe(0);
});

// TC-MC-10: Health Score — composite of other metrics
test('TC-MC-10: health score confidence is derived from underlying metrics', () => {
  const issues = [doneIssue(), doneIssue({ 'Issue Key': 'P-2' })];
  const result = calculateMetricConfidence(issues);
  expect(result.healthScore.confidence).toBeGreaterThan(0);
  expect(result.healthScore.confidence).toBeLessThanOrEqual(100);
});

// TC-MC-11: Reason is always a non-empty string
test('TC-MC-11: all metrics have non-empty reason string', () => {
  const issues = [doneIssue()];
  const result = calculateMetricConfidence(issues);
  Object.values(result).forEach(m => {
    expect(typeof m.reason).toBe('string');
    expect(m.reason.length).toBeGreaterThan(5);
  });
});

// TC-MC-12: Confidence is always 0–100
test('TC-MC-12: all confidence values are clamped to 0–100', () => {
  const issues = [issue(), doneIssue({ 'In Progress Date': '', 'Done Date': '', 'Story Points': 0 })];
  const result = calculateMetricConfidence(issues);
  Object.values(result).forEach(m => {
    expect(m.confidence).toBeGreaterThanOrEqual(0);
    expect(m.confidence).toBeLessThanOrEqual(100);
  });
});

// TC-MC-13: Epics excluded from orphan check
test('TC-MC-13: epics excluded from orphan risk confidence check', () => {
  const issues = [
    issue({ 'Issue Key': 'EPIC-1', 'Issue Type': 'Epic', 'Epic Link': '' }),
    issue({ 'Issue Key': 'S-1', 'Issue Type': 'Story', 'Epic Link': 'EPIC-1' }),
  ];
  const result = calculateMetricConfidence(issues);
  // Sample size should exclude the Epic
  expect(result.orphanRisk.sampleSize).toBe(1);
});

// TC-MC-14: Mid-sprint — sprint items without start/end → Medium or Low
test('TC-MC-14: sprint items without sprint dates → mid-sprint confidence low', () => {
  const issues = Array(5).fill(null).map((_, i) =>
    issue({ 'Issue Key': `P-${i}`, 'Sprint Start': '', 'Sprint End': '' })
  );
  const result = calculateMetricConfidence(issues);
  expect(result.midSprint.confidence).toBe(0);
  expect(['Low', 'Unreliable']).toContain(result.midSprint.band);
});
