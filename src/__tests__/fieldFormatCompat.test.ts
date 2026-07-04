// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Work Item Explorer field-format compatibility tests — TC-FF-01 to TC-FF-06
// Confirms buildRelationGraph resolves issue fields identically whether the
// dataset uses raw JiraIssue export field names (Title Case), normalized
// FlowItem field names (camelCase), or a mixture of both (FR-225A).

import { buildRelationGraph } from '../services/relations/relationExplorer.service';

// Issues that carry ONLY raw JiraIssue export field names — no FlowItem fields at all.
function rawIssue(key: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    'Issue Key': key,
    'Issue Type': type,
    'Summary': `Summary of ${key}`,
    'Status': 'In Progress',
    'Assignee': 'Ali',
    'Story Points': 3,
    ...extra,
  };
}

// Issues that carry ONLY normalized FlowItem field names — no raw Jira fields at all.
function flowIssue(key: string, type: string, extra: Record<string, unknown> = {}) {
  return {
    key,
    type,
    summary: `Summary of ${key}`,
    status: 'In Progress',
    assignee: 'Ali',
    storyPoints: 3,
    health: 'good',
    ...extra,
  };
}

// TC-FF-01: raw-only dataset — issueKey/type/summary resolved from "Issue Key"/"Issue Type"/"Summary"
test('TC-FF-01: raw-only fields resolve issueKey, type, and summary', () => {
  const epic  = rawIssue('PROJ-1', 'Epic');
  const story = rawIssue('PROJ-10', 'Story', { 'Epic Link': 'PROJ-1' });
  const graph = buildRelationGraph('PROJ-10', [epic, story]);
  expect(graph).not.toBeNull();
  const focus = graph!.nodes.find(n => n.issueKey === 'PROJ-10');
  expect(focus).toBeDefined();
  expect(focus?.type).toBe('Story');
  expect(focus?.summary).toBe('Summary of PROJ-10');
});

// TC-FF-02: FlowItem-only dataset — issueKey/type/summary resolved from "key"/"type"/"summary"
test('TC-FF-02: FlowItem-only fields resolve issueKey, type, and summary', () => {
  const epic  = flowIssue('PROJ-1', 'Epic');
  const story = flowIssue('PROJ-10', 'Story', { epic: 'PROJ-1' });
  const graph = buildRelationGraph('PROJ-10', [epic, story]);
  expect(graph).not.toBeNull();
  const focus = graph!.nodes.find(n => n.issueKey === 'PROJ-10');
  expect(focus).toBeDefined();
  expect(focus?.type).toBe('Story');
  expect(focus?.summary).toBe('Summary of PROJ-10');
});

// TC-FF-03: raw-only "Status: Done" (no "status" field present) marks the node done
test('TC-FF-03: raw-only "Status" field resolves isDone and health', () => {
  const epic = rawIssue('PROJ-1', 'Epic');
  const task = rawIssue('PROJ-11', 'Task', { 'Parent Key': 'PROJ-1', 'Status': 'Done' });
  const graph = buildRelationGraph('PROJ-1', [epic, task]);
  const node = graph!.nodes.find(n => n.issueKey === 'PROJ-11');
  expect(node?.isDone).toBe(true);
  expect(node?.health).toBe('done');
});

// TC-FF-04: raw-only "Blocked Flag: true" (no "isBlocked" field present) marks the node blocked
test('TC-FF-04: raw-only "Blocked Flag" field resolves isBlocked and health', () => {
  const epic = rawIssue('PROJ-1', 'Epic');
  const task = rawIssue('PROJ-11', 'Task', { 'Parent Key': 'PROJ-1', 'Blocked Flag': true });
  const graph = buildRelationGraph('PROJ-1', [epic, task]);
  const node = graph!.nodes.find(n => n.issueKey === 'PROJ-11');
  expect(node?.isBlocked).toBe(true);
  expect(node?.health).toBe('critical');
});

// TC-FF-05: raw-only "Parent Key"/"Epic Link" fields reconstruct the same hierarchy as FlowItem fields
test('TC-FF-05: raw-only "Parent Key"/"Epic Link" fields resolve hierarchy depth and parentKey', () => {
  const epic  = rawIssue('PROJ-1', 'Epic');
  const story = rawIssue('PROJ-10', 'Story', { 'Epic Link': 'PROJ-1' });
  const task  = rawIssue('PROJ-11', 'Task', { 'Parent Key': 'PROJ-10' });
  const graph = buildRelationGraph('PROJ-10', [epic, story, task]);
  const focus = graph!.nodes.find(n => n.issueKey === 'PROJ-10');
  const parent = graph!.nodes.find(n => n.issueKey === 'PROJ-1');
  const child = graph!.nodes.find(n => n.issueKey === 'PROJ-11');
  expect(focus?.depth).toBe(0);
  expect(parent?.depth).toBe(-1);
  expect(child?.depth).toBe(1);
  expect(child?.parentKey).toBe('PROJ-10');
});

// TC-FF-06: a dataset that mixes raw-only and FlowItem-only issues builds one consistent graph
test('TC-FF-06: mixed raw/FlowItem dataset builds a single consistent graph', () => {
  const epic       = rawIssue('PROJ-1', 'Epic');                                     // raw-only
  const story      = flowIssue('PROJ-10', 'Story', { epic: 'PROJ-1' });              // FlowItem-only
  const blockedTask = rawIssue('PROJ-11', 'Task', { 'Parent Key': 'PROJ-10', 'Blocked Flag': true }); // raw-only, blocked
  const doneTask   = flowIssue('PROJ-12', 'Task', { parent: 'PROJ-10', status: 'Done', health: 'done' }); // FlowItem-only, done

  const graph = buildRelationGraph('PROJ-10', [epic, story, blockedTask, doneTask]);
  expect(graph).not.toBeNull();
  const keys = graph!.nodes.map(n => n.issueKey);
  expect(keys).toEqual(expect.arrayContaining(['PROJ-1', 'PROJ-10', 'PROJ-11', 'PROJ-12']));

  const blocked = graph!.nodes.find(n => n.issueKey === 'PROJ-11');
  const done    = graph!.nodes.find(n => n.issueKey === 'PROJ-12');
  expect(blocked?.isBlocked).toBe(true);
  expect(done?.isDone).toBe(true);

  // Risk-path computation walks the same hierarchy regardless of source format —
  // the blocked raw-only task and its FlowItem-only parent must both be marked.
  expect(blocked?.isOnRiskPath).toBe(true);
  const story10 = graph!.nodes.find(n => n.issueKey === 'PROJ-10');
  expect(story10?.isOnRiskPath).toBe(true);
});
