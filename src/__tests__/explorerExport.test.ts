// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Explorer export tests — TC-EX-01 to TC-EX-08

import * as XLSX from 'xlsx';
import { buildExplorerCsv, buildExplorerWorkbook } from '../services/export/explorerExport.service';
import type { RelationGraph, RelationNode, RelationStats } from '../types/relations';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeNode(overrides: Partial<RelationNode> = {}): RelationNode {
  return {
    id: 'PROJ-1',
    issueKey: 'PROJ-1',
    summary: 'Test story',
    type: 'Story',
    status: 'In Progress',
    assignee: 'Ali',
    priority: 'High',
    storyPoints: 5,
    health: 'good',
    isBlocked: false,
    isOrphan: false,
    isMissingParent: false,
    isMissingEpic: false,
    isDone: false,
    sprint: 'Sprint 1',
    epicLink: 'EPIC-1',
    parentKey: '',
    reason: '',
    depth: 0,
    childCount: 2,
    isExpanded: false,
    isFocusNode: true,
    isOnRiskPath: false,
    isLargestBranch: false,
    ...overrides,
  };
}

function makeStats(overrides: Partial<RelationStats> = {}): RelationStats {
  return {
    totalRelated: 5,
    completedCount: 2,
    openCount: 3,
    blockedCount: 1,
    bugCount: 0,
    criticalCount: 1,
    totalStoryPoints: 15,
    completedStoryPoints: 6,
    completionPct: 40,
    blockedRatio: 20,
    dependencyCount: 0,
    orphanCount: 1,
    deliveryConfidence: 65,
    largestUnfinishedBranch: { rootKey: 'PROJ-2', rootLabel: 'PROJ-2 — Child', openCount: 2, totalCount: 3, completionPct: 33 },
    ...overrides,
  };
}

function makeGraph(overrides: Partial<RelationGraph> = {}): RelationGraph {
  const focus   = makeNode({ issueKey: 'PROJ-1', isFocusNode: true, depth: 0 });
  const child1  = makeNode({ id: 'PROJ-2', issueKey: 'PROJ-2', summary: 'Child task', type: 'Task', depth: 1, isFocusNode: false, parentKey: 'PROJ-1' });
  const child2  = makeNode({ id: 'PROJ-3', issueKey: 'PROJ-3', summary: 'Blocked child', type: 'Bug', depth: 1, isFocusNode: false, isBlocked: true, health: 'critical', isOnRiskPath: true, parentKey: 'PROJ-1' });
  const orphan  = makeNode({ id: 'PROJ-4', issueKey: 'PROJ-4', summary: 'Orphan item', type: 'Story', depth: 0, isFocusNode: false, isOrphan: true, health: 'orphan', epicLink: '', parentKey: '' });

  return {
    focusKey: 'PROJ-1',
    focusType: 'Story',
    nodes: [focus, child1, child2],
    edges: [],
    orphanNodes: [orphan],
    stats: makeStats(),
    insights: ['2 items are in this hierarchy.', '1 item is blocked.'],
    ...overrides,
  };
}

// ── TC-EX-01: Workbook has exactly 5 sheets ───────────────────────────────────

test('TC-EX-01: workbook contains exactly 5 sheets', () => {
  const wb = buildExplorerWorkbook(makeGraph());
  expect(wb.SheetNames).toHaveLength(5);
});

test('TC-EX-01b: sheet names match expected names', () => {
  const wb = buildExplorerWorkbook(makeGraph());
  expect(wb.SheetNames[0]).toBe('01 Summary');
  expect(wb.SheetNames[1]).toBe('02 All Issues');
  expect(wb.SheetNames[2]).toBe('03 Risk Items');
  expect(wb.SheetNames[3]).toBe('04 Orphans');
  expect(wb.SheetNames[4]).toBe('05 Insights');
});

// ── TC-EX-02: Summary sheet contains focus key and stats ─────────────────────

test('TC-EX-02: Summary sheet contains focus key and delivery confidence', () => {
  const wb  = buildExplorerWorkbook(makeGraph());
  const ws  = wb.Sheets['01 Summary'];
  const csv = XLSX.utils.sheet_to_csv(ws);
  expect(csv).toContain('PROJ-1');
  expect(csv).toContain('Story');
  expect(csv).toContain('65%');
  expect(csv).toContain('40%');
});

test('TC-EX-02b: Summary sheet contains largest branch info', () => {
  const wb  = buildExplorerWorkbook(makeGraph());
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets['01 Summary']);
  expect(csv).toContain('PROJ-2');
  expect(csv).toContain('33%');
});

// ── TC-EX-03: All Issues sheet has all nodes including orphans ────────────────

test('TC-EX-03: All Issues sheet has 4 rows (3 nodes + 1 orphan)', () => {
  const wb   = buildExplorerWorkbook(makeGraph());
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['02 All Issues'], { header: 1 }) as unknown[][];
  // 1 header + 4 issue rows
  expect(rows).toHaveLength(5);
});

test('TC-EX-03b: All Issues sheet has required columns', () => {
  const wb  = buildExplorerWorkbook(makeGraph());
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets['02 All Issues']);
  expect(csv).toContain('Key');
  expect(csv).toContain('Health');
  expect(csv).toContain('On Risk Path');
  expect(csv).toContain('Orphan');
});

// ── TC-EX-04: Risk Items sheet only contains blocked/critical/risk-path nodes ─

test('TC-EX-04: Risk Items sheet only contains risk-flagged nodes', () => {
  const wb  = buildExplorerWorkbook(makeGraph());
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets['03 Risk Items']);
  expect(csv).toContain('PROJ-3');   // blocked child
  expect(csv).not.toContain('PROJ-2'); // healthy child
  expect(csv).not.toContain('PROJ-4'); // orphan (not in risk sheet)
});

// ── TC-EX-05: Orphans sheet only contains orphan nodes ───────────────────────

test('TC-EX-05: Orphans sheet contains only orphan items', () => {
  const wb  = buildExplorerWorkbook(makeGraph());
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets['04 Orphans']);
  expect(csv).toContain('PROJ-4');
  expect(csv).not.toContain('PROJ-1');
  expect(csv).not.toContain('PROJ-2');
  expect(csv).not.toContain('PROJ-3');
});

// ── TC-EX-06: Insights sheet contains insight text ───────────────────────────

test('TC-EX-06: Insights sheet contains insight text', () => {
  const wb  = buildExplorerWorkbook(makeGraph());
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets['05 Insights']);
  expect(csv).toContain('2 items are in this hierarchy.');
  expect(csv).toContain('1 item is blocked.');
});

// ── TC-EX-07: Empty orphans + empty risk items handled gracefully ─────────────

test('TC-EX-07: no orphans or risk items shows placeholder row', () => {
  const graph = makeGraph({
    nodes: [makeNode({ issueKey: 'PROJ-1', isBlocked: false, health: 'good', isOnRiskPath: false })],
    orphanNodes: [],
    insights: [],
  });
  const wb = buildExplorerWorkbook(graph);
  expect(XLSX.utils.sheet_to_csv(wb.Sheets['03 Risk Items'])).toContain('(no risk items)');
  expect(XLSX.utils.sheet_to_csv(wb.Sheets['04 Orphans'])).toContain('(no orphan items)');
  expect(XLSX.utils.sheet_to_csv(wb.Sheets['05 Insights'])).toContain('(no insights generated)');
});

// ── TC-EX-08: No HTML or [object Object] in any cell ─────────────────────────

test('TC-EX-08: no HTML tags or object literals in any cell', () => {
  const wb = buildExplorerWorkbook(makeGraph());
  wb.SheetNames.forEach(name => {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
    expect(csv).not.toMatch(/<[a-z]+[\s>]/i);
    expect(csv).not.toContain('[object Object]');
    expect(csv).not.toContain('className');
  });
});

test('TC-EX-09: Explorer workbook and CSV neutralize formula-like Jira fields', () => {
  const graph = makeGraph({
    nodes: [makeNode({ summary: '=cmd|\'/c calc\'!A1', reason: '@HYPERLINK("http://evil.example","click")' })],
    orphanNodes: [],
    insights: ['+malicious-looking insight'],
  });

  const wb = buildExplorerWorkbook(graph);
  expect(wb.Sheets['02 All Issues'].B2.v).toBe("'=cmd|'/c calc'!A1");
  expect(wb.Sheets['02 All Issues'].Q2.v).toBe('\'@HYPERLINK("http://evil.example","click")');
  expect(wb.Sheets['05 Insights'].B2.v).toBe("'+malicious-looking insight");

  const csv = buildExplorerCsv(graph);
  expect(csv).toContain("PROJ-1,'=cmd|'/c calc'!A1");
  expect(csv).toContain("'@HYPERLINK(\"\"http://evil.example\"\",\"\"click\"\")");
});

test('TC-EX-10: Explorer export leaves benign Jira fields unchanged', () => {
  const graph = makeGraph({
    nodes: [makeNode({ summary: 'Normal story summary', reason: 'Blocked by dependency' })],
    orphanNodes: [],
  });

  const wb = buildExplorerWorkbook(graph);
  expect(wb.Sheets['02 All Issues'].B2.v).toBe('Normal story summary');
  expect(wb.Sheets['02 All Issues'].Q2.v).toBe('Blocked by dependency');
});
