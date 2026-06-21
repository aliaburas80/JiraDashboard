// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Work Item Explorer tests — TC-E-01 to TC-E-08

import { buildRelationGraph } from '../services/relations/relationExplorer.service';

function issue(key: string, type: string, extra: Record<string, unknown> = {}) {
  return { key, 'Issue Key': key, type, 'Issue Type': type, summary: `Summary of ${key}`, Summary: `Summary of ${key}`, status: 'In Progress', Status: 'In Progress', assignee: 'Ali', Assignee: 'Ali', health: 'good', storyPoints: 3, 'Story Points': 3, ...extra };
}

const EPIC  = issue('PROJ-1', 'Epic');
const STORY = issue('PROJ-10', 'Story', { 'Epic Link': 'PROJ-1', epic: 'PROJ-1' });
const TASK1 = issue('PROJ-11', 'Task',  { 'Parent Key': 'PROJ-10', parent: 'PROJ-10' });
const TASK2 = issue('PROJ-12', 'Task',  { 'Parent Key': 'PROJ-10', parent: 'PROJ-10', status: 'Done', Status: 'Done', health: 'done' });
const BUG   = issue('PROJ-13', 'Bug',   { 'Parent Key': 'PROJ-10', parent: 'PROJ-10', status: 'Done', Status: 'Done', health: 'done' });
const ORPHAN= issue('PROJ-99', 'Story', { isOrphan: true });

const allIssues = [EPIC, STORY, TASK1, TASK2, BUG, ORPHAN];

// TC-E-01: Focus on Story → parent Epic above, Tasks/Bug below
test('TC-E-01: Story focus — shows Epic parent + direct children', () => {
  const graph = buildRelationGraph('PROJ-10', allIssues);
  expect(graph).not.toBeNull();
  const keys = graph!.nodes.map(n => n.issueKey);
  expect(keys).toContain('PROJ-1');   // parent epic
  expect(keys).toContain('PROJ-10');  // focus
  expect(keys).toContain('PROJ-11');  // child task
  expect(keys).toContain('PROJ-12');
  expect(keys).toContain('PROJ-13');
});

// TC-E-02: Focus on Epic → all stories as children
test('TC-E-02: Epic focus — shows children stories', () => {
  const graph = buildRelationGraph('PROJ-1', allIssues);
  expect(graph).not.toBeNull();
  const keys = graph!.nodes.map(n => n.issueKey);
  expect(keys).toContain('PROJ-1');   // focus
  expect(keys).toContain('PROJ-10');  // child story
});

// TC-E-03: Focus node is correctly marked isFocusNode
test('TC-E-03: Focus node has isFocusNode = true', () => {
  const graph = buildRelationGraph('PROJ-10', allIssues);
  const focus = graph!.nodes.find(n => n.issueKey === 'PROJ-10');
  expect(focus?.isFocusNode).toBe(true);
  const others = graph!.nodes.filter(n => n.issueKey !== 'PROJ-10');
  others.forEach(n => expect(n.isFocusNode).toBe(false));
});

// TC-E-04: Invalid key → returns null
test('TC-E-04: Non-existent key returns null', () => {
  const graph = buildRelationGraph('PROJ-9999', allIssues);
  expect(graph).toBeNull();
});

// TC-E-05: Stats completionPct is correct
test('TC-E-05: Stats completionPct reflects done nodes', () => {
  const graph = buildRelationGraph('PROJ-10', allIssues);
  // TASK2 and BUG are done
  expect(graph!.stats.completedCount).toBeGreaterThanOrEqual(2);
  expect(graph!.stats.completionPct).toBeGreaterThan(0);
});

// TC-E-06: Orphan issue is detected
test('TC-E-06: Orphan issue flagged in hierarchy orphanKeys', () => {
  const { reconstructHierarchy } = require('../services/relations/hierarchy.service');
  const map = reconstructHierarchy(allIssues);
  expect(map.orphanKeys.has('PROJ-99')).toBe(true);
});

// TC-E-07: Focus node has correct depth = 0
test('TC-E-07: Focus node depth is 0', () => {
  const graph = buildRelationGraph('PROJ-10', allIssues);
  const focus = graph!.nodes.find(n => n.issueKey === 'PROJ-10');
  expect(focus?.depth).toBe(0);
});

// TC-E-08: Parent node has depth = -1, children have depth = 1
test('TC-E-08: Parent depth -1, children depth 1', () => {
  const graph = buildRelationGraph('PROJ-10', allIssues);
  const parent = graph!.nodes.find(n => n.issueKey === 'PROJ-1');
  const child  = graph!.nodes.find(n => n.issueKey === 'PROJ-11');
  expect(parent?.depth).toBe(-1);
  expect(child?.depth).toBe(1);
});

// TC-E-09: Multi-level ancestor chain (e.g. Epic -> Initiative -> Project root) is
// shown in full, not truncated to one level up.
const INITIATIVE = issue('PROJ-30', 'Epic', {}); // root-level ancestor of EPIC2
const EPIC2       = issue('PROJ-31', 'Epic', { 'Parent Key': 'PROJ-30', parent: 'PROJ-30' });
const STORY2      = issue('PROJ-32', 'Story', { 'Epic Link': 'PROJ-31', epic: 'PROJ-31' });
const multiLevelIssues = [INITIATIVE, EPIC2, STORY2];

test('TC-E-09: Ancestor chain includes grandparent, not just immediate parent', () => {
  const graph = buildRelationGraph('PROJ-31', multiLevelIssues);
  expect(graph).not.toBeNull();
  const keys = graph!.nodes.map(n => n.issueKey);
  expect(keys).toContain('PROJ-30'); // grandparent / root ancestor
  expect(keys).toContain('PROJ-31'); // focus
});

test('TC-E-10: Ancestor depths count down from the focus node (closest = -1, root = -N)', () => {
  const graph = buildRelationGraph('PROJ-31', multiLevelIssues);
  const root  = graph!.nodes.find(n => n.issueKey === 'PROJ-30');
  expect(root?.depth).toBe(-1);
});

test('TC-E-11: Ancestor-chain edge (root -> closest parent) is present in the graph', () => {
  const graph = buildRelationGraph('PROJ-31', multiLevelIssues);
  const edge = graph!.edges.find(e => e.sourceId === 'PROJ-30' && e.targetId === 'PROJ-31');
  expect(edge).toBeDefined();
});
