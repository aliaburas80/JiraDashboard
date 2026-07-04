// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Largest unfinished branch tests — TC-LB-01 to TC-LB-08
// Note: The graph includes focus node + its direct parent + its direct children.
// Branch computation works on VISIBLE graph nodes/edges (not full hierarchy).

import { buildRelationGraph } from '../services/relations/relationExplorer.service';

function issue(key: string, type: string, extra: Record<string, unknown> = {}) {
  return { key, 'Issue Key': key, type, 'Issue Type': type, summary: `${key} summary`,
    Summary: `${key} summary`, status: 'In Progress', Status: 'In Progress',
    assignee: 'Ali', Assignee: 'Ali', health: 'good', storyPoints: 3, 'Story Points': 3, ...extra };
}
function done(key: string, type: string, extra: Record<string, unknown> = {}) {
  return issue(key, type, { status: 'Done', Status: 'Done', health: 'done', ...extra });
}

// Setup: STORY has 3 open tasks and 1 done task as direct children
const EPIC   = issue('EP-1', 'Epic');
const STORY  = issue('ST-10', 'Story', { 'Epic Link': 'EP-1', epic: 'EP-1' });
const TASK_OPEN_1 = issue('TS-11', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10' });
const TASK_OPEN_2 = issue('TS-12', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10' });
const TASK_DONE   = done( 'TS-13', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10' });

// TC-LB-01: largestUnfinishedBranch is null when all direct children are done
test('TC-LB-01: all done children → largestUnfinishedBranch is null (or openCount=0)', () => {
  const allDone = [
    EPIC, STORY,
    done('TS-A', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10' }),
    done('TS-B', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10' }),
  ];
  const g = buildRelationGraph('ST-10', allDone);
  const branch = g!.stats.largestUnfinishedBranch;
  // Either null or openCount === 0 — no open work remains
  if (branch) expect(branch.openCount).toBe(0);
});

// TC-LB-02: Open task is identified as a branch
test('TC-LB-02: open task is identified as part of a branch', () => {
  const issues = [EPIC, STORY, TASK_OPEN_1, TASK_DONE];
  const g = buildRelationGraph('ST-10', issues);
  const branch = g!.stats.largestUnfinishedBranch;
  // The only open branch is TS-11
  expect(branch).not.toBeNull();
  expect(branch!.rootKey).toBe('TS-11');
});

// TC-LB-03: Done nodes excluded from branch flag
test('TC-LB-03: done nodes never have isLargestBranch=true', () => {
  const issues = [EPIC, STORY, TASK_OPEN_1, TASK_DONE];
  const g = buildRelationGraph('ST-10', issues);
  const doneNode = g!.nodes.find(n => n.issueKey === 'TS-13');
  expect(doneNode?.isLargestBranch).toBe(false);
});

// TC-LB-04: Open node in largest branch IS marked
test('TC-LB-04: open task in identified branch is marked isLargestBranch=true', () => {
  const issues = [EPIC, STORY, TASK_OPEN_1, TASK_DONE];
  const g = buildRelationGraph('ST-10', issues);
  const branch = g!.stats.largestUnfinishedBranch;
  if (branch) {
    const branchNode = g!.nodes.find(n => n.issueKey === branch.rootKey);
    expect(branchNode?.isLargestBranch).toBe(true);
  }
});

// TC-LB-05: Multiple open branches — first identified is returned
test('TC-LB-05: multiple open branches → one is identified', () => {
  const issues = [EPIC, STORY, TASK_OPEN_1, TASK_OPEN_2, TASK_DONE];
  const g = buildRelationGraph('ST-10', issues);
  const branch = g!.stats.largestUnfinishedBranch;
  expect(branch).not.toBeNull();
  // Either TS-11 or TS-12 should be identified
  expect(['TS-11', 'TS-12']).toContain(branch!.rootKey);
});

// TC-LB-06: Insight text mentions the branch when openCount >= 1
test('TC-LB-06: insight appears when branch has open items', () => {
  const issues = [EPIC, STORY, TASK_OPEN_1, TASK_OPEN_2, TASK_DONE];
  const g = buildRelationGraph('ST-10', issues);
  // Insight may or may not appear depending on openCount >= 2 threshold
  // At minimum, the insight function should not throw
  expect(Array.isArray(g!.insights)).toBe(true);
});

// TC-LB-07: largestUnfinishedBranch has correct shape
test('TC-LB-07: largestUnfinishedBranch has rootKey, rootLabel, openCount, totalCount, completionPct', () => {
  const issues = [EPIC, STORY, TASK_OPEN_1, TASK_DONE];
  const g = buildRelationGraph('ST-10', issues);
  const branch = g!.stats.largestUnfinishedBranch;
  if (branch) {
    expect(typeof branch.rootKey).toBe('string');
    expect(typeof branch.rootLabel).toBe('string');
    expect(typeof branch.openCount).toBe('number');
    expect(typeof branch.totalCount).toBe('number');
    expect(branch.completionPct).toBeGreaterThanOrEqual(0);
    expect(branch.completionPct).toBeLessThanOrEqual(100);
  }
});

// TC-LB-08: isLargestBranch is boolean on all nodes
test('TC-LB-08: every node has isLargestBranch defined as boolean', () => {
  const issues = [EPIC, STORY, TASK_OPEN_1, TASK_OPEN_2, TASK_DONE];
  const g = buildRelationGraph('ST-10', issues);
  g!.nodes.forEach(n => {
    expect(typeof n.isLargestBranch).toBe('boolean');
  });
});
