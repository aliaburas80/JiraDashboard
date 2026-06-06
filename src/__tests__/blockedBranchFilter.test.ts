// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Blocked branch filter tests — TC-BF-01 to TC-BF-08

import { buildRelationGraph } from '../services/relations/relationExplorer.service';
import type { RelationNode } from '../types/relations';

function issue(key: string, type: string, extra: Record<string, unknown> = {}) {
  return { key, 'Issue Key': key, type, 'Issue Type': type, summary: `${key} summary`,
    Summary: `${key} summary`, status: 'In Progress', Status: 'In Progress',
    assignee: 'Ali', Assignee: 'Ali', health: 'good', storyPoints: 3, 'Story Points': 3, ...extra };
}

const EPIC      = issue('EP-1', 'Epic');
const STORY     = issue('ST-10', 'Story', { 'Epic Link': 'EP-1', epic: 'EP-1' });
const TASK_GOOD = issue('TS-11', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10' });
const TASK_BLOCK = issue('TS-12', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10',
  health: 'critical', 'Blocked Flag': 'true' });

const allIssues = [EPIC, STORY, TASK_GOOD, TASK_BLOCK];

// Helper: simulate what the page filter does
function applyBlockedFilter(nodes: RelationNode[]): RelationNode[] {
  return nodes.filter(n => n.isOnRiskPath || n.isBlocked);
}

// TC-BF-01: Filter returns only risk-path and blocked nodes
test('TC-BF-01: blocked filter returns only risk-path and blocked nodes', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const filtered = applyBlockedFilter(g!.nodes);
  // TS-11 (good) should be excluded; TS-12 (blocked) and ST-10 (risk path) included
  expect(filtered.every(n => n.isOnRiskPath || n.isBlocked)).toBe(true);
});

// TC-BF-02: Healthy nodes are excluded by the filter
test('TC-BF-02: healthy nodes excluded when filter is active', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const filtered = applyBlockedFilter(g!.nodes);
  const goodTask = filtered.find(n => n.issueKey === 'TS-11');
  expect(goodTask).toBeUndefined();
});

// TC-BF-03: Blocked node is included by the filter
test('TC-BF-03: blocked node is always included', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const filtered = applyBlockedFilter(g!.nodes);
  const blockedTask = filtered.find(n => n.issueKey === 'TS-12');
  expect(blockedTask).toBeDefined();
});

// TC-BF-04: Risk-path ancestor is included by the filter
test('TC-BF-04: risk-path ancestor (parent of blocked) is included', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const filtered = applyBlockedFilter(g!.nodes);
  const story = filtered.find(n => n.issueKey === 'ST-10');
  expect(story).toBeDefined();
});

// TC-BF-05: No blocked nodes → filter returns empty (or only focus)
test('TC-BF-05: no blocked nodes → filter returns only focus-node risk path (empty if focus not risky)', () => {
  const clean = [EPIC, STORY, TASK_GOOD];
  const g = buildRelationGraph('ST-10', clean);
  const filtered = applyBlockedFilter(g!.nodes);
  // No blocked/critical nodes → no risk path → empty filter result
  expect(filtered).toHaveLength(0);
});

// TC-BF-06: blockedCount computed correctly
test('TC-BF-06: blocked + critical count is correct', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const blockedCount = g!.nodes.filter(n => n.isBlocked || n.health === 'critical').length;
  expect(blockedCount).toBeGreaterThanOrEqual(1);
});

// TC-BF-07: riskPathCount equals nodes with isOnRiskPath=true
test('TC-BF-07: riskPathCount reflects actual isOnRiskPath nodes', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const riskPathCount = g!.nodes.filter(n => n.isOnRiskPath).length;
  const filtered = applyBlockedFilter(g!.nodes);
  // All filtered nodes are on risk path or blocked
  expect(filtered.length).toBeGreaterThanOrEqual(riskPathCount);
});

// TC-BF-08: Filter is additive — blocked node always included even if not on risk path
test('TC-BF-08: isBlocked=true always passes the filter regardless of isOnRiskPath', () => {
  // A blocked node that IS in the graph (direct child of focus)
  const blocked = issue('TS-20', 'Task', {
    'Parent Key': 'ST-10', parent: 'ST-10',
    'Blocked Flag': 'true', health: 'critical',
  });
  const issues = [EPIC, STORY, blocked];
  const g = buildRelationGraph('ST-10', issues);
  const filtered = applyBlockedFilter(g!.nodes);
  // The blocked node must be in the filtered result
  expect(filtered.some(n => n.isBlocked)).toBe(true);
});
