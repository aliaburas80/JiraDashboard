// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Kanban flow tests — CP3-006 per-issue-type cycle/lead time breakdown
// (calculateKanbanFlow's new cycleTimeByType field). Existing blended
// avgCycleTimeDays/avgLeadTimeDays behavior is also asserted unchanged.

import { calculateKanbanFlow } from '../services/metrics/kanbanFlow.service';

function makeKanbanIssue(overrides: Record<string, unknown>) {
  return {
    'Issue Key':        overrides['Issue Key'] ?? 'KAN-1',
    'Issue Type':       overrides['Issue Type'] ?? 'Bug',
    'Status':           overrides['Status'] ?? 'Done',
    'Created Date':     overrides['Created Date'] ?? '2025-01-01',
    'In Progress Date': overrides['In Progress Date'] ?? '2025-01-02',
    'Done Date':        overrides['Done Date'] ?? '2025-01-04',
    // Deliberately no Sprint fields — this is what makes an issue "Kanban".
    ...overrides,
  };
}

// TC-KB-01: no issues at all → empty summary, cycleTimeByType is an empty array.
test('TC-KB-01: no issues → hasKanbanData false, cycleTimeByType is []', () => {
  const result = calculateKanbanFlow([]);
  expect(result.hasKanbanData).toBe(false);
  expect(result.cycleTimeByType).toEqual([]);
});

// TC-KB-02: only sprint-tracked issues (none Kanban) → same empty-summary path.
test('TC-KB-02: only sprint issues → no Kanban data, cycleTimeByType is []', () => {
  const issues = [
    makeKanbanIssue({ 'Issue Key': 'S-1', Sprint: 'Sprint 1' }),
  ];
  const result = calculateKanbanFlow(issues);
  expect(result.hasKanbanData).toBe(false);
  expect(result.cycleTimeByType).toEqual([]);
});

// TC-KB-03: two issue types with very different cycle times — the blended
// avgCycleTimeDays/avgLeadTimeDays must stay a mix of both, while
// cycleTimeByType keeps each type's own average separate (CP3-006).
test('TC-KB-03: Bug (fast) + Epic (slow) — blended average mixes both, per-type breakdown keeps them separate', () => {
  const issues = [
    makeKanbanIssue({ 'Issue Key': 'BUG-1', 'Issue Type': 'Bug', 'Created Date': '2025-01-01', 'In Progress Date': '2025-01-02', 'Done Date': '2025-01-04' }), // cycle 2, lead 3
    makeKanbanIssue({ 'Issue Key': 'BUG-2', 'Issue Type': 'Bug', 'Created Date': '2025-01-01', 'In Progress Date': '2025-01-02', 'Done Date': '2025-01-04' }), // cycle 2, lead 3
    makeKanbanIssue({ 'Issue Key': 'EPIC-1', 'Issue Type': 'Epic', 'Created Date': '2025-01-01', 'In Progress Date': '2025-01-03', 'Done Date': '2025-01-23' }), // cycle 20, lead 22
    makeKanbanIssue({ 'Issue Key': 'EPIC-2', 'Issue Type': 'Epic', 'Created Date': '2025-01-01', 'In Progress Date': '2025-01-03', 'Done Date': '2025-01-23' }), // cycle 20, lead 22
  ];

  const result = calculateKanbanFlow(issues);

  expect(result.hasKanbanData).toBe(true);
  // Blended headline figures are unchanged by this finding — average of [2,2,20,20] and [3,3,22,22].
  expect(result.avgCycleTimeDays).toBe(11);
  expect(result.avgLeadTimeDays).toBe(12.5);

  const byType = result.cycleTimeByType ?? [];
  expect(byType).toHaveLength(2);

  const bug = byType.find(t => t.type === 'Bug');
  expect(bug).toBeDefined();
  expect(bug?.count).toBe(2);
  expect(bug?.avgCycleTimeDays).toBe(2);
  expect(bug?.avgLeadTimeDays).toBe(3);
  expect(bug?.cycleTimeSampleSize).toBe(2);
  expect(bug?.leadTimeSampleSize).toBe(2);

  const epic = byType.find(t => t.type === 'Epic');
  expect(epic).toBeDefined();
  expect(epic?.count).toBe(2);
  expect(epic?.avgCycleTimeDays).toBe(20);
  expect(epic?.avgLeadTimeDays).toBe(22);
});

// TC-KB-04: an issue missing In Progress Date contributes to leadTime but not
// cycleTime for its type — matches the zero-denominator guard used by the
// existing blended aggregate (avg() returns 0 for an empty array).
test('TC-KB-04: missing In Progress Date → cycleTimeSampleSize 0 for that type, leadTime still counted', () => {
  const issues = [
    makeKanbanIssue({
      'Issue Key': 'TASK-1', 'Issue Type': 'Task',
      'Created Date': '2025-01-01', 'In Progress Date': null, 'Done Date': '2025-01-06',
    }),
  ];

  const result = calculateKanbanFlow(issues);
  const task = (result.cycleTimeByType ?? []).find(t => t.type === 'Task');

  expect(task).toBeDefined();
  expect(task?.cycleTimeSampleSize).toBe(0);
  expect(task?.avgCycleTimeDays).toBe(0);
  expect(task?.leadTimeSampleSize).toBe(1);
  expect(task?.avgLeadTimeDays).toBe(5);
});

// TC-KB-05: an issue with no Issue Type field groups under 'Unknown' rather
// than being silently dropped from the breakdown.
test('TC-KB-05: missing Issue Type groups under "Unknown"', () => {
  const issues = [
    makeKanbanIssue({ 'Issue Key': 'X-1', 'Issue Type': undefined }),
  ];

  const result = calculateKanbanFlow(issues);
  const unknown = (result.cycleTimeByType ?? []).find(t => t.type === 'Unknown');
  expect(unknown).toBeDefined();
  expect(unknown?.count).toBe(1);
});

// TC-KB-06: only active (non-done) Kanban issues of a type exist → that type
// contributes zero to cycleTimeByType, since the breakdown is scoped to done
// issues only (same population as the blended aggregate).
test('TC-KB-06: active (not done) issues are excluded from cycleTimeByType', () => {
  const issues = [
    makeKanbanIssue({ 'Issue Key': 'D-1', 'Issue Type': 'Bug', Status: 'Done' }),
    makeKanbanIssue({ 'Issue Key': 'A-1', 'Issue Type': 'Story', Status: 'In Progress', 'Done Date': null }),
  ];

  const result = calculateKanbanFlow(issues);
  const types = (result.cycleTimeByType ?? []).map(t => t.type);
  expect(types).toContain('Bug');
  expect(types).not.toContain('Story');
});
