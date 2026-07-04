// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Risk-path highlight tests — TC-RP-01 to TC-RP-08

import { buildRelationGraph } from '../services/relations/relationExplorer.service';

function issue(key: string, type: string, extra: Record<string, unknown> = {}) {
  return { key, 'Issue Key': key, type, 'Issue Type': type, summary: `${key}`, Summary: `${key}`,
    status: 'In Progress', Status: 'In Progress', assignee: 'Ali', Assignee: 'Ali',
    health: 'good', storyPoints: 3, 'Story Points': 3, ...extra };
}

const EPIC   = issue('EP-1',  'Epic');
const STORY  = issue('ST-10', 'Story',   { 'Epic Link': 'EP-1', epic: 'EP-1' });
const TASK_OK     = issue('TS-11', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10' });
const TASK_BLOCK  = issue('TS-12', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10',
  health: 'critical', 'Blocked Flag': 'true' });
const TASK_DONE   = issue('TS-13', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10',
  status: 'Done', Status: 'Done', health: 'done' });

const allIssues = [EPIC, STORY, TASK_OK, TASK_BLOCK, TASK_DONE];

// TC-RP-01: Blocked task → its parent story is on risk path
test('TC-RP-01: blocked task marks parent story as on risk path', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const story = g!.nodes.find(n => n.issueKey === 'ST-10');
  const blockedTask = g!.nodes.find(n => n.issueKey === 'TS-12');
  expect(blockedTask?.isOnRiskPath).toBe(true);
  expect(story?.isOnRiskPath).toBe(true);
});

// TC-RP-02: Non-blocked/critical task → NOT on risk path
test('TC-RP-02: healthy task is not on risk path', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const okTask = g!.nodes.find(n => n.issueKey === 'TS-11');
  expect(okTask?.isOnRiskPath).toBe(false);
});

// TC-RP-03: Done critical items do NOT create risk path (historical data)
test('TC-RP-03: done items are excluded from risk path even if critical', () => {
  const doneIssues = [EPIC, STORY, TASK_DONE,
    issue('TS-99', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10',
      status: 'Done', Status: 'Done', health: 'critical' })];
  const g = buildRelationGraph('ST-10', doneIssues);
  // All done → no risk path nodes (excluding focus)
  const riskNodes = g!.nodes.filter(n => n.isOnRiskPath && !n.isFocusNode);
  expect(riskNodes).toHaveLength(0);
});

// TC-RP-04: Risk-path edges are marked
test('TC-RP-04: edge between blocked task and parent is marked as risk path', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const riskEdge = g!.edges.find(e =>
    (e.sourceId === 'ST-10' && e.targetId === 'TS-12') ||
    (e.sourceId === 'TS-12' && e.targetId === 'ST-10')
  );
  expect(riskEdge?.isOnRiskPath).toBe(true);
});

// TC-RP-05: Edge to healthy task is NOT a risk-path edge
test('TC-RP-05: edge to healthy task is not a risk path edge', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  const okEdge = g!.edges.find(e =>
    (e.sourceId === 'ST-10' && e.targetId === 'TS-11') ||
    (e.sourceId === 'TS-11' && e.targetId === 'ST-10')
  );
  expect(okEdge?.isOnRiskPath).toBeFalsy();
});

// TC-RP-06: No risky nodes → no risk paths
test('TC-RP-06: all healthy nodes produce no risk path', () => {
  const clean = [EPIC, STORY, TASK_OK];
  const g = buildRelationGraph('ST-10', clean);
  const riskNodes = g!.nodes.filter(n => n.isOnRiskPath);
  expect(riskNodes).toHaveLength(0);
});

// TC-RP-07: Multiple risky nodes → multiple paths merged
test('TC-RP-07: two blocked tasks both mark their parent as on risk path', () => {
  const task2 = issue('TS-14', 'Task', { 'Parent Key': 'ST-10', parent: 'ST-10',
    health: 'critical' });
  const issues = [EPIC, STORY, TASK_BLOCK, task2];
  const g = buildRelationGraph('ST-10', issues);
  const story = g!.nodes.find(n => n.issueKey === 'ST-10');
  expect(story?.isOnRiskPath).toBe(true);
  const riskNodeCount = g!.nodes.filter(n => n.isOnRiskPath).length;
  expect(riskNodeCount).toBeGreaterThanOrEqual(3); // story + 2 blocked tasks
});

// TC-RP-08: isOnRiskPath field exists on all nodes
test('TC-RP-08: every node in the graph has isOnRiskPath defined', () => {
  const g = buildRelationGraph('ST-10', allIssues);
  g!.nodes.forEach(n => {
    expect(typeof n.isOnRiskPath).toBe('boolean');
  });
});
