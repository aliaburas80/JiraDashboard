// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Release readiness tests — TC-RR-01 to TC-RR-10

import { calculateReleaseReadiness } from '../services/metrics/releaseReadiness.service';

function issue(key: string, extra: Record<string, unknown> = {}) {
  return { 'Issue Key': key, 'Issue Type': 'Story', 'Summary': `${key}`,
    'Status': 'In Progress', 'Assignee': 'Ali', 'Fix Version/s': 'v1.0',
    health: 'good', ...extra };
}
function done(key: string, extra: Record<string, unknown> = {}) {
  return issue(key, { 'Status': 'Done', health: 'done', ...extra });
}

// TC-RR-01: No fix versions → hasVersionData=false
test('TC-RR-01: no Fix Version → hasVersionData=false', () => {
  const issues = [issue('T-1', { 'Fix Version/s': '' }), issue('T-2', { 'Fix Version/s': '' })];
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
  const issues = [done('T-1'), issue('T-2', { 'Blocked Flag': 'true' }), done('T-3')];
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].verdict).toBe('No-Go');
  expect(r.noGoCount).toBe(1);
});

// TC-RR-04: < 70% complete → No-Go
test('TC-RR-04: completion < 70% → No-Go', () => {
  const issues = [done('T-1'), issue('T-2'), issue('T-3'), issue('T-4')]; // 25%
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].verdict).toBe('No-Go');
  expect(r.releases[0].completionPct).toBeLessThan(70);
});

// TC-RR-05: 70–89% complete, no blockers, open bug → Conditional Go
test('TC-RR-05: 70–89% complete with open bug → Conditional Go', () => {
  const issues = [
    done('T-1'), done('T-2'), done('T-3'), done('T-4'), done('T-5'),
    done('T-6'), done('T-7'),
    issue('T-8', { 'Issue Type': 'Bug' }),
    issue('T-9'),
    issue('T-10'),
  ]; // 70%, 1 open bug
  const r = calculateReleaseReadiness(issues);
  expect(r.releases[0].verdict).toBe('Conditional Go');
});

// TC-RR-06: Multiple versions grouped correctly
test('TC-RR-06: issues in different versions create separate release results', () => {
  const issues = [
    done('T-1', { 'Fix Version/s': 'v1.0' }),
    issue('T-2', { 'Fix Version/s': 'v2.0' }),
  ];
  const r = calculateReleaseReadiness(issues);
  expect(r.totalVersions).toBe(2);
  expect(r.releases.map(r => r.version)).toContain('v1.0');
  expect(r.releases.map(r => r.version)).toContain('v2.0');
});

// TC-RR-07: completionPct calculation is correct
test('TC-RR-07: completionPct calculated correctly', () => {
  const issues = [done('T-1'), done('T-2'), issue('T-3'), issue('T-4')]; // 50%
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
  const issues = [issue('T-1', { 'Blocked Flag': 'true' }), done('T-2')];
  const r = calculateReleaseReadiness(issues);
  const blockerCheck = r.releases[0].checklist.find(c => c.id === 'blockers');
  expect(blockerCheck?.blocking).toBe(true);
  expect(blockerCheck?.passed).toBe(false);
});

// TC-RR-10: No-Go sorts before Conditional Go before Go
test('TC-RR-10: releases sorted No-Go first, then Conditional, then Go', () => {
  const issues = [
    done('A-1', { 'Fix Version/s': 'v3.0' }),
    done('A-2', { 'Fix Version/s': 'v3.0' }),
    done('A-3', { 'Fix Version/s': 'v3.0' }), // Go
    issue('B-1', { 'Fix Version/s': 'v2.0', 'Blocked Flag': 'true' }), // No-Go
    done('C-1', { 'Fix Version/s': 'v1.0' }),
    done('C-2', { 'Fix Version/s': 'v1.0' }),
    done('C-3', { 'Fix Version/s': 'v1.0' }),
    done('C-4', { 'Fix Version/s': 'v1.0' }),
    done('C-5', { 'Fix Version/s': 'v1.0' }),
    done('C-6', { 'Fix Version/s': 'v1.0' }),
    done('C-7', { 'Fix Version/s': 'v1.0' }),
    done('C-8', { 'Fix Version/s': 'v1.0' }),
    issue('C-9', { 'Fix Version/s': 'v1.0', 'Issue Type': 'Bug' }), // 88% + bug → Conditional
    issue('C-10', { 'Fix Version/s': 'v1.0' }),
  ];
  const r = calculateReleaseReadiness(issues);
  const verdicts = r.releases.map(rel => rel.verdict);
  const noGoIdx        = verdicts.indexOf('No-Go');
  const conditionalIdx = verdicts.indexOf('Conditional Go');
  const goIdx          = verdicts.indexOf('Go');
  if (noGoIdx >= 0 && conditionalIdx >= 0) expect(noGoIdx).toBeLessThan(conditionalIdx);
  if (conditionalIdx >= 0 && goIdx >= 0)   expect(conditionalIdx).toBeLessThan(goIdx);
});
