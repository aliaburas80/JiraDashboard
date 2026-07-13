// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Release readiness tests — TC-RR-01 to TC-RR-11
//
// Fixtures use the normalized FlowItem shape (camelCase), the same shape
// DashboardMetrics.flow.items actually is in production, not raw Jira export
// column names. The previous version of this file built raw-column fixtures
// and passed them directly to calculateReleaseReadiness(), which matched the
// function's old (buggy) signature but not what the app's pages actually
// call it with — masking the CP3-001 bug where every real call site passed
// FlowItem[] and got hasVersionData=false unconditionally. See TODO-List.md.

import { calculateReleaseReadiness } from '../services/metrics/releaseReadiness.service';
import type { FlowItem } from '../types/metrics';

function buildFlowItem(key: string, extra: Partial<FlowItem> = {}): FlowItem {
  return {
    key,
    summary: key,
    type: 'Story',
    status: 'In Progress',
    highLevelStatus: '',
    sprint: '',
    epic: '',
    isOrphan: false,
    assignee: 'Ali',
    priority: 'Medium',
    storyPoints: 0,
    createdDate: '',
    startedDate: '',
    doneDate: '',
    leadTimeDays: null,
    cycleTimeDays: null,
    ageDays: null,
    activeAgeDays: null,
    labels: '',
    parent: '',
    project: '',
    health: 'good',
    reason: '',
    fixVersion: 'v1.0',
    blocked: false,
    ...extra,
  };
}

function done(key: string, extra: Partial<FlowItem> = {}): FlowItem {
  return buildFlowItem(key, { status: 'Done', health: 'good', ...extra });
}

// TC-RR-01: No fix versions → hasVersionData=false
test('TC-RR-01: no Fix Version → hasVersionData=false', () => {
  const issues = [buildFlowItem('T-1', { fixVersion: '' }), buildFlowItem('T-2', { fixVersion: '' })];
  const r = calculateReleaseReadiness(issues);
  expect(r.hasVersionData).toBe(false);
  expect(r.releases).toHaveLength(0);
});

// TC-RR-02: 100% done, no blockers → Go
test('TC-RR-02: all done, no blockers → Go verdict', () => {
  const issues = [done('T-1'), done('T-2'), done('T-3')];
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].verdict).toBe('Go');
  expect(r.goCount).toBe(1);
});

// TC-RR-03: Blocker present → No-Go
test('TC-RR-03: blocker present → No-Go verdict', () => {
  const issues = [done('T-1'), buildFlowItem('T-2', { blocked: true }), done('T-3')];
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].verdict).toBe('No-Go');
  expect(r.noGoCount).toBe(1);
});

// TC-RR-04: < 70% complete → No-Go
test('TC-RR-04: completion < 70% → No-Go', () => {
  const issues = [done('T-1'), buildFlowItem('T-2'), buildFlowItem('T-3'), buildFlowItem('T-4')]; // 25%
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].verdict).toBe('No-Go');
  expect(r.releases[0].completionPct).toBeLessThan(70);
});

// TC-RR-05: 70–89% complete, no blockers, open bug → Conditional Go
test('TC-RR-05: 70–89% complete with open bug → Conditional Go', () => {
  const issues = [
    done('T-1'), done('T-2'), done('T-3'), done('T-4'), done('T-5'),
    done('T-6'), done('T-7'),
    buildFlowItem('T-8', { type: 'Bug' }),
    buildFlowItem('T-9'),
    buildFlowItem('T-10'),
  ]; // 70%, 1 open bug
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].verdict).toBe('Conditional Go');
});

// TC-RR-06: Multiple versions grouped correctly
test('TC-RR-06: issues in different versions create separate release results', () => {
  const issues = [
    done('T-1', { fixVersion: 'v1.0' }),
    buildFlowItem('T-2', { fixVersion: 'v2.0' }),
  ];
  const r = calculateReleaseReadiness(issues);
  expect(r.totalVersions).toBe(2);
  expect(r.releases.map(r => r.version)).toContain('v1.0');
  expect(r.releases.map(r => r.version)).toContain('v2.0');
});

// TC-RR-07: completionPct calculation is correct
test('TC-RR-07: completionPct calculated correctly', () => {
  const issues = [done('T-1'), done('T-2'), buildFlowItem('T-3'), buildFlowItem('T-4')]; // 50%
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].completionPct).toBe(50);
});

// TC-RR-08: Checklist has 7 items
test('TC-RR-08: checklist contains 7 items', () => {
  const issues = [done('T-1'), done('T-2')];
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].checklist).toHaveLength(7);
});

// TC-RR-09: Blocking checks fail correctly
test('TC-RR-09: blocker check is marked as blocking=true and passed=false', () => {
  const issues = [buildFlowItem('T-1', { blocked: true }), done('T-2')];
  const r = calculateReleaseReadiness(issues);
  const blockerCheck = r.releases[0].checklist.find(c => c.id === 'blockers');
  expect(blockerCheck?.blocking).toBe(true);
  expect(blockerCheck?.passed).toBe(false);
});

// TC-RR-10: No-Go sorts before Conditional Go before Go
test('TC-RR-10: releases sorted No-Go first, then Conditional, then Go', () => {
  const issues = [
    done('A-1', { fixVersion: 'v3.0' }),
    done('A-2', { fixVersion: 'v3.0' }),
    done('A-3', { fixVersion: 'v3.0' }), // Go
    buildFlowItem('B-1', { fixVersion: 'v2.0', blocked: true }), // No-Go
    done('C-1', { fixVersion: 'v1.0' }),
    done('C-2', { fixVersion: 'v1.0' }),
    done('C-3', { fixVersion: 'v1.0' }),
    done('C-4', { fixVersion: 'v1.0' }),
    done('C-5', { fixVersion: 'v1.0' }),
    done('C-6', { fixVersion: 'v1.0' }),
    done('C-7', { fixVersion: 'v1.0' }),
    done('C-8', { fixVersion: 'v1.0' }),
    buildFlowItem('C-9', { fixVersion: 'v1.0', type: 'Bug' }), // 88% + bug → Conditional
    buildFlowItem('C-10', { fixVersion: 'v1.0' }),
  ];
  const r = calculateReleaseReadiness(issues);
  const verdicts = r.releases.map(rel => rel.verdict);
  const noGoIdx        = verdicts.indexOf('No-Go');
  const conditionalIdx = verdicts.indexOf('Conditional Go');
  const goIdx          = verdicts.indexOf('Go');
  if (noGoIdx >= 0 && conditionalIdx >= 0) expect(noGoIdx).toBeLessThan(conditionalIdx);
  if (conditionalIdx >= 0 && goIdx >= 0)   expect(conditionalIdx).toBeLessThan(goIdx);
});

// TC-RR-11 (regression, CP3-001): calculateReleaseReadiness must produce real
// results when called with the exact FlowItem[] shape the app's pages pass it
// (metrics.flow.items), not just column-name fixtures. This is the specific
// integration gap that let the original bug ship with a fully green test suite.
test('TC-RR-11 (regression): real FlowItem[] with a populated fixVersion produces a non-empty, evaluated result', () => {
  const items: FlowItem[] = [
    done('REG-1', { fixVersion: 'v9.0' }),
    done('REG-2', { fixVersion: 'v9.0' }),
    buildFlowItem('REG-3', { fixVersion: 'v9.0' }),
  ];
  const r = calculateReleaseReadiness(items);
  expect(r.hasVersionData).toBe(true);
  expect(r.totalVersions).toBe(1);
  expect(r.releases[0].version).toBe('v9.0');
  expect(r.releases[0].verdict).not.toBe('Insufficient Data');
});
