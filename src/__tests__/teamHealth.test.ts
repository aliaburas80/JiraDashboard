// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Team health comparison tests — TC-TH-01 to TC-TH-10

import { computeTeamHealth, teamBandColor, teamBandBg } from '../lib/teamHealth';
import type { CapacityEntry, FlowItem } from '../types/metrics';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeCap(overrides: Partial<CapacityEntry> = {}): CapacityEntry {
  return {
    assignee:       'Ali',
    issues:         10,
    activeIssues:   3,
    doneIssues:     7,
    storyPoints:    20,
    doneStoryPoints: 14,
    loadShare:      25,
    ...overrides,
  };
}

function makeItem(overrides: Partial<FlowItem> = {}): FlowItem {
  return {
    key: 'PROJ-1', summary: 'Test', type: 'Story',
    status: 'In Progress', highLevelStatus: 'Active',
    sprint: 'S1', epic: 'E1', isOrphan: false,
    assignee: 'Ali', priority: 'High', storyPoints: 2,
    createdDate: '2025-01-01', startedDate: '2025-01-05', doneDate: '',
    leadTimeDays: null, cycleTimeDays: null, ageDays: 5, activeAgeDays: 5,
    labels: '', parent: '', project: 'PROJ',
    health: 'good', reason: '', linkedTo: '', fixVersion: '', blocked: false,
    ...overrides,
  };
}

// ── TC-TH-01: Perfect team → score = 100 ─────────────────────────────────────

test('TC-TH-01: fully done team scores 100', () => {
  const cap   = [makeCap({ issues: 5, doneIssues: 5, activeIssues: 0 })];
  const items = [
    makeItem({ status: 'Done', health: 'good', reason: '' }),
  ];
  const result = computeTeamHealth(cap, items);
  expect(result[0].healthScore).toBe(100);
  expect(result[0].band).toBe('Healthy');
});

// ── TC-TH-02: All critical → low score ───────────────────────────────────────

test('TC-TH-02: all critical items produce Critical band score', () => {
  const cap   = [makeCap({ issues: 5, doneIssues: 0, activeIssues: 5 })];
  const items = Array.from({ length: 5 }, (_, i) =>
    makeItem({ key: `PROJ-${i}`, status: 'In Progress', health: 'critical', reason: '' }),
  );
  const result = computeTeamHealth(cap, items);
  expect(result[0].healthScore).toBeLessThan(40);
  expect(result[0].band).toBe('Critical');
});

// ── TC-TH-03: Blocked items counted correctly ─────────────────────────────────

test('TC-TH-03: blocked reason counted in blockedCount', () => {
  const cap   = [makeCap({ issues: 4, doneIssues: 0, activeIssues: 4 })];
  const items = [
    makeItem({ status: 'In Progress', health: 'critical', reason: 'Blocked flag is set.' }),
    makeItem({ key: 'PROJ-2', status: 'In Progress', health: 'critical', reason: 'Blocked flag is set.' }),
    makeItem({ key: 'PROJ-3', status: 'In Progress', health: 'good',     reason: '' }),
    makeItem({ key: 'PROJ-4', status: 'In Progress', health: 'warning',  reason: '' }),
  ];
  const result = computeTeamHealth(cap, items);
  expect(result[0].blockedCount).toBe(2);
});

// ── TC-TH-04: Done items excluded from risk counts ───────────────────────────

test('TC-TH-04: done-status items are not counted as critical or blocked', () => {
  const cap   = [makeCap({ issues: 3, doneIssues: 2, activeIssues: 1 })];
  const items = [
    makeItem({ key: 'A', status: 'Done', health: 'critical', reason: 'Blocked flag is set.' }),
    makeItem({ key: 'B', status: 'Closed', health: 'critical', reason: '' }),
    makeItem({ key: 'C', status: 'In Progress', health: 'good', reason: '' }),
  ];
  const result = computeTeamHealth(cap, items);
  expect(result[0].criticalCount).toBe(0);
  expect(result[0].blockedCount).toBe(0);
});

// ── TC-TH-05: Results sorted by health score descending ──────────────────────

test('TC-TH-05: results sorted by healthScore descending', () => {
  const cap = [
    makeCap({ assignee: 'Bob',   issues: 10, doneIssues: 2, activeIssues: 8, loadShare: 30 }),
    makeCap({ assignee: 'Alice', issues: 10, doneIssues: 9, activeIssues: 1, loadShare: 30 }),
    makeCap({ assignee: 'Carol', issues: 10, doneIssues: 5, activeIssues: 5, loadShare: 40 }),
  ];
  const result = computeTeamHealth(cap, []);
  expect(result[0].assignee).toBe('Alice');
  expect(result[result.length - 1].assignee).toBe('Bob');
});

// ── TC-TH-06: avgOpenAgeDays computed correctly ───────────────────────────────

test('TC-TH-06: avgOpenAgeDays is mean of open-item ageDays', () => {
  const cap   = [makeCap({ issues: 2, doneIssues: 0, activeIssues: 2 })];
  const items = [
    makeItem({ key: 'A', status: 'In Progress', ageDays: 10 }),
    makeItem({ key: 'B', status: 'In Progress', ageDays: 20 }),
  ];
  const result = computeTeamHealth(cap, items);
  expect(result[0].avgOpenAgeDays).toBe(15);
});

// ── TC-TH-07: done items excluded from avgOpenAgeDays ────────────────────────

test('TC-TH-07: done items not included in avgOpenAgeDays', () => {
  const cap   = [makeCap({ issues: 3, doneIssues: 1, activeIssues: 2 })];
  const items = [
    makeItem({ key: 'A', status: 'Done',        ageDays: 100 }),
    makeItem({ key: 'B', status: 'In Progress', ageDays: 6   }),
    makeItem({ key: 'C', status: 'In Progress', ageDays: 14  }),
  ];
  const result = computeTeamHealth(cap, items);
  expect(result[0].avgOpenAgeDays).toBe(10); // (6+14)/2, not including 100
});

// ── TC-TH-08: empty capacity returns empty array ──────────────────────────────

test('TC-TH-08: empty capacity returns empty array', () => {
  expect(computeTeamHealth([], [])).toEqual([]);
});

// ── TC-TH-09: score clamped 0–100 ────────────────────────────────────────────

test('TC-TH-09: healthScore is always 0–100', () => {
  const cap   = [makeCap({ issues: 100, doneIssues: 0, activeIssues: 100 })];
  const items = Array.from({ length: 100 }, (_, i) =>
    makeItem({ key: `X-${i}`, status: 'In Progress', health: 'critical', reason: 'Blocked flag is set.' }),
  );
  const result = computeTeamHealth(cap, items);
  expect(result[0].healthScore).toBeGreaterThanOrEqual(0);
  expect(result[0].healthScore).toBeLessThanOrEqual(100);
});

// ── TC-TH-10: band helper colors ─────────────────────────────────────────────

test('TC-TH-10: teamBandColor and teamBandBg return correct values per band', () => {
  expect(teamBandColor('Healthy')).toBe('#16a34a');
  expect(teamBandColor('At Risk')).toBe('#f59e0b');
  expect(teamBandColor('Critical')).toBe('#dc2626');
  expect(teamBandBg('Healthy')).toBe('#f0fdf4');
  expect(teamBandBg('At Risk')).toBe('#fffbeb');
  expect(teamBandBg('Critical')).toBe('#fef2f2');
});
