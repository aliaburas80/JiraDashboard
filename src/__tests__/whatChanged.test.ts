// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// What Changed panel logic tests — TC-WC-01 to TC-WC-10

import type { TrendPoint } from '../types/trends';

// ── Mirrors panel logic ───────────────────────────────────────────────────────

interface Change { label: string; prev: string; curr: string; delta: string; dir: 'improved' | 'declined' | 'stable' }

function buildChanges(prev: TrendPoint, curr: TrendPoint): Change[] {
  const changes: Change[] = [];
  function add(label: string, prevVal: number, currVal: number, unit: string, hib = true, threshold = 0.5) {
    const delta = currVal - prevVal;
    if (Math.abs(delta) < threshold) return;
    const dir: Change['dir'] = (delta > 0 && hib) || (delta < 0 && !hib) ? 'improved' : 'declined';
    const sign = delta > 0 ? '+' : '';
    changes.push({ label, prev: `${prevVal}${unit}`, curr: `${currVal}${unit}`, delta: `${sign}${Math.round(delta * 10) / 10}${unit}`, dir });
  }
  add('Health Score',   prev.healthScore,    curr.healthScore,    '/100', true,  1);
  add('Completion',     prev.completionRate, curr.completionRate, '%',    true,  1);
  add('Done Issues',    prev.doneIssues,     curr.doneIssues,     '',     true,  1);
  add('Total Issues',   prev.totalIssues,    curr.totalIssues,    '',     true,  1);
  add('Blocked Items',  prev.blockedIssues,  curr.blockedIssues,  '',     false, 1);
  add('Critical Items', prev.criticalCount,  curr.criticalCount,  '',     false, 1);
  add('Avg Lead Time',  prev.avgLeadTimeDays, curr.avgLeadTimeDays, 'd',  false, 0.5);
  return changes;
}

function buildNarrative(prev: TrendPoint, curr: TrendPoint, changes: Change[]): string {
  if (changes.length === 0) return 'Metrics are broadly the same as the previous upload.';
  const parts: string[] = [];
  const doneDelta = curr.doneIssues - prev.doneIssues;
  const compDelta = curr.completionRate - prev.completionRate;
  const blockedDelta = curr.blockedIssues - prev.blockedIssues;
  if (Math.abs(doneDelta) >= 1) parts.push(`${Math.abs(doneDelta)} item${Math.abs(doneDelta) !== 1 ? 's' : ''} ${doneDelta > 0 ? 'completed' : 'moved back'}`);
  if (Math.abs(compDelta) >= 1) parts.push(`completion ${compDelta > 0 ? 'up' : 'down'} ${Math.abs(Math.round(compDelta))}%`);
  if (blockedDelta !== 0) parts.push(`${Math.abs(blockedDelta)} ${blockedDelta > 0 ? 'new' : 'fewer'} blocked item${Math.abs(blockedDelta) !== 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(', ') + '.' : 'Minor metric changes detected.';
}

function makePt(overrides: Partial<TrendPoint> = {}): TrendPoint {
  return {
    id: 'x', fileName: 'jira.csv', uploadedAt: '2025-01-01T00:00:00Z',
    healthScore: 70, totalIssues: 100, doneIssues: 60, completionRate: 60,
    blockedIssues: 3, activeIssues: 20, openDefects: 2,
    avgLeadTimeDays: 12, avgCycleTimeDays: 6, criticalCount: 5,
    dataQualityScore: 80, avgSprintThroughput: 8, ...overrides,
  };
}

// TC-WC-01: No change below threshold → no entries
test('TC-WC-01: metrics within threshold produce no changes', () => {
  const prev = makePt({ healthScore: 70, completionRate: 60 });
  const curr = makePt({ healthScore: 70.3, completionRate: 60.4 });
  expect(buildChanges(prev, curr)).toHaveLength(0);
});

// TC-WC-02: Health score improvement → improved entry
test('TC-WC-02: health score increase → improved change', () => {
  const prev = makePt({ healthScore: 65 });
  const curr = makePt({ healthScore: 78 });
  const ch   = buildChanges(prev, curr).find(c => c.label === 'Health Score');
  expect(ch?.dir).toBe('improved');
  expect(ch?.delta).toBe('+13/100');
});

// TC-WC-03: Health score decline → declined entry
test('TC-WC-03: health score decrease → declined change', () => {
  const prev = makePt({ healthScore: 80 });
  const curr = makePt({ healthScore: 65 });
  const ch   = buildChanges(prev, curr).find(c => c.label === 'Health Score');
  expect(ch?.dir).toBe('declined');
});

// TC-WC-04: Blocked items increase → declined (lower is better)
test('TC-WC-04: blocked items increase → declined', () => {
  const prev = makePt({ blockedIssues: 1 });
  const curr = makePt({ blockedIssues: 5 });
  const ch   = buildChanges(prev, curr).find(c => c.label === 'Blocked Items');
  expect(ch?.dir).toBe('declined');
});

// TC-WC-05: Blocked items decrease → improved
test('TC-WC-05: blocked items decrease → improved', () => {
  const prev = makePt({ blockedIssues: 5 });
  const curr = makePt({ blockedIssues: 1 });
  const ch   = buildChanges(prev, curr).find(c => c.label === 'Blocked Items');
  expect(ch?.dir).toBe('improved');
});

// TC-WC-06: Lead time reduction → improved
test('TC-WC-06: lead time reduction → improved', () => {
  const prev = makePt({ avgLeadTimeDays: 15 });
  const curr = makePt({ avgLeadTimeDays: 8 });
  const ch   = buildChanges(prev, curr).find(c => c.label === 'Avg Lead Time');
  expect(ch?.dir).toBe('improved');
});

// TC-WC-07: Narrative includes done item count
test('TC-WC-07: narrative mentions completed items count', () => {
  const prev = makePt({ doneIssues: 40, completionRate: 40, blockedIssues: 2 });
  const curr = makePt({ doneIssues: 55, completionRate: 55, blockedIssues: 2 });
  const changes = buildChanges(prev, curr);
  const text = buildNarrative(prev, curr, changes);
  expect(text).toContain('15 items completed');
});

// TC-WC-08: Narrative mentions blocked reduction
test('TC-WC-08: narrative mentions fewer blocked items', () => {
  const prev = makePt({ blockedIssues: 5, doneIssues: 60, completionRate: 60 });
  const curr = makePt({ blockedIssues: 2, doneIssues: 60, completionRate: 60 });
  const changes = buildChanges(prev, curr);
  const text = buildNarrative(prev, curr, changes);
  expect(text).toContain('fewer blocked');
});

// TC-WC-09: No changes → stable narrative
test('TC-WC-09: no changes → stable narrative returned', () => {
  const pt = makePt();
  expect(buildNarrative(pt, pt, [])).toBe('Metrics are broadly the same as the previous upload.');
});

// TC-WC-10: Improved/declined counts correct
test('TC-WC-10: improved and declined counts are correct', () => {
  const prev = makePt({ healthScore: 60, blockedIssues: 2 });
  const curr = makePt({ healthScore: 75, blockedIssues: 5 });
  const changes = buildChanges(prev, curr);
  expect(changes.filter(c => c.dir === 'improved').length).toBeGreaterThanOrEqual(1);
  expect(changes.filter(c => c.dir === 'declined').length).toBeGreaterThanOrEqual(1);
});
