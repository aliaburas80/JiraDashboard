// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Throughput formula tests — TC-T-01 to TC-T-10

import { calculateSprintThroughput } from '../services/metrics/throughput.service';

function makeIssue(overrides: Record<string, unknown>) {
  return {
    'Issue Key':   overrides['Issue Key'] ?? 'TEST-1',
    'Issue Type':  overrides['Issue Type'] ?? 'Story',
    'Summary':     overrides['Summary'] ?? 'Test issue',
    'Status':      overrides['Status'] ?? 'In Progress',
    'Sprint':      overrides['Sprint'] ?? 'Sprint 1',
    'Story Points':overrides['Story Points'] ?? 0,
    'Done Date':   overrides['Done Date'] ?? null,
    'Sprint Start':overrides['Sprint Start'] ?? '2025-01-01',
    'Sprint End':  overrides['Sprint End'] ?? '2025-01-14',
    ...overrides,
  };
}

// TC-T-01: Sprint with 10 committed, 8 done → completionPct = 80%, goalOutcome = "Partially Met"
test('TC-T-01: 10 committed 8 done → 80% completion, Partially Met', () => {
  const issues = [
    ...Array(8).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-${i}`, 'Status': 'Done', 'Done Date': '2025-01-10' })),
    ...Array(2).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-open-${i}`, 'Status': 'In Progress' })),
  ];
  const result = calculateSprintThroughput(issues);
  const sprint = result.sprints[0];
  expect(sprint.completedCount).toBe(8);
  expect(sprint.committedCount).toBe(10);
  expect(sprint.completionPct).toBe(80);
  expect(sprint.goalOutcome).toBe('Partially Met');
});

// TC-T-02: Sprint midpoint at day 7, 3 done by day 7, 8 done total → midSprintPct = 30%
test('TC-T-02: 3 done by midpoint, 10 committed → midSprintPct = 30%', () => {
  const issues = [
    ...Array(3).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-m${i}`, 'Status': 'Done', 'Done Date': '2025-01-07' })),
    ...Array(5).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-l${i}`, 'Status': 'Done', 'Done Date': '2025-01-13' })),
    ...Array(2).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-o${i}`, 'Status': 'In Progress' })),
  ];
  const result = calculateSprintThroughput(issues);
  const sprint = result.sprints[0];
  expect(sprint.midSprintDoneCount).toBe(3);
  expect(sprint.midSprintPct).toBe(30);
});

// TC-T-03: Average throughput across 3 sprints [8,10,12] → average = 10
test('TC-T-03: Average throughput of 3 sprints [8,10,12] = 10', () => {
  const sprints = [
    { name: 'Sprint 1', done: 8,  total: 10, start: '2025-01-01', end: '2025-01-14' },
    { name: 'Sprint 2', done: 10, total: 12, start: '2025-01-15', end: '2025-01-28' },
    { name: 'Sprint 3', done: 12, total: 14, start: '2025-01-29', end: '2025-02-11' },
  ];
  const issues = sprints.flatMap(s => [
    ...Array(s.done).fill(null).map((_, i) =>
      makeIssue({ 'Issue Key': `${s.name.replace(' ', '')}-d${i}`, 'Sprint': s.name, 'Status': 'Done', 'Done Date': s.end, 'Sprint Start': s.start, 'Sprint End': s.end })),
    ...Array(s.total - s.done).fill(null).map((_, i) =>
      makeIssue({ 'Issue Key': `${s.name.replace(' ', '')}-o${i}`, 'Sprint': s.name, 'Status': 'In Progress', 'Sprint Start': s.start, 'Sprint End': s.end })),
  ]);
  const result = calculateSprintThroughput(issues);
  expect(result.averageThroughputCount).toBe(10);
  expect(result.totalSprints).toBe(3);
});

// TC-T-04: completionPct >= 90% → goalOutcome = "Met"
test('TC-T-04: completionPct >= 90% → Met', () => {
  const issues = [
    ...Array(9).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-d${i}`, 'Status': 'Done', 'Done Date': '2025-01-10' })),
    makeIssue({ 'Issue Key': 'S1-o', 'Status': 'In Progress' }),
  ];
  const result = calculateSprintThroughput(issues);
  expect(result.sprints[0].goalOutcome).toBe('Met');
});

// TC-T-05: completionPct < 60% (past sprint end) → goalOutcome = "Missed"
test('TC-T-05: completionPct < 60% past sprint end → Missed', () => {
  const issues = [
    ...Array(5).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-d${i}`, 'Status': 'Done', 'Done Date': '2025-01-10', 'Sprint End': '2020-01-14' })),
    ...Array(5).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-o${i}`, 'Status': 'In Progress', 'Sprint End': '2020-01-14' })),
  ];
  const result = calculateSprintThroughput(issues);
  expect(result.sprints[0].goalOutcome).toBe('Missed');
});

// TC-T-06: Added scope detection
test('TC-T-06: addedAfterSprintStart items counted correctly', () => {
  const issues = [
    makeIssue({ 'Issue Key': 'S1-1', 'Status': 'Done', 'Done Date': '2025-01-10' }),
    makeIssue({ 'Issue Key': 'S1-2', 'Status': 'In Progress', 'Added After Sprint Start': 'true' }),
    makeIssue({ 'Issue Key': 'S1-3', 'Status': 'In Progress', 'Added After Sprint Start': 'true' }),
  ];
  const result = calculateSprintThroughput(issues);
  expect(result.sprints[0].addedScopeCount).toBe(2);
});

// TC-T-07: End-loaded pattern when midSprintPct < 20%
test('TC-T-07: midSprintPct < 20% → End-Loaded Sprint pattern', () => {
  const issues = [
    ...Array(1).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-m${i}`, 'Status': 'Done', 'Done Date': '2025-01-07' })),
    ...Array(9).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-l${i}`, 'Status': 'Done', 'Done Date': '2025-01-13' })),
  ];
  const result = calculateSprintThroughput(issues);
  expect(result.sprints[0].deliveryPattern).toBe('End-Loaded Sprint');
  expect(result.endLoadedSprintCount).toBe(1);
});

// TC-T-08: Healthy early progress when midSprintPct >= 50%
test('TC-T-08: midSprintPct >= 50% → Healthy Early Progress', () => {
  const issues = [
    ...Array(6).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-m${i}`, 'Status': 'Done', 'Done Date': '2025-01-07' })),
    ...Array(4).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-l${i}`, 'Status': 'Done', 'Done Date': '2025-01-13' })),
  ];
  const result = calculateSprintThroughput(issues);
  expect(result.sprints[0].deliveryPattern).toBe('Healthy Early Progress');
});

// TC-T-09: Scope instability when addedScope > 20% of committed
test('TC-T-09: addedScope > 20% committed → Scope Instability', () => {
  const issues = [
    ...Array(8).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-c${i}`, 'Status': 'Done', 'Done Date': '2025-01-10' })),
    ...Array(3).fill(null).map((_, i) => makeIssue({ 'Issue Key': `S1-a${i}`, 'Status': 'In Progress', 'Added After Sprint Start': 'true' })),
  ];
  const result = calculateSprintThroughput(issues);
  expect(result.sprints[0].deliveryPattern).toBe('Scope Instability');
});

// TC-T-10: Blocked sprint when blockedCount >= 2
test('TC-T-10: 2+ blocked items → Blocked Sprint pattern', () => {
  const issues = [
    makeIssue({ 'Issue Key': 'S1-b1', 'Status': 'In Progress', 'Blocked Flag': 'true' }),
    makeIssue({ 'Issue Key': 'S1-b2', 'Status': 'In Progress', 'Blocked Flag': 'true' }),
    makeIssue({ 'Issue Key': 'S1-d1', 'Status': 'Done', 'Done Date': '2025-01-10' }),
  ];
  const result = calculateSprintThroughput(issues);
  expect(result.sprints[0].blockedCount).toBe(2);
  expect(result.sprints[0].deliveryPattern).toBe('Blocked Sprint');
});
