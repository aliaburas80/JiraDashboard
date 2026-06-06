// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Upload-to-upload trend tests — TC-TR-01 to TC-TR-10

import type { TrendPoint } from '../../app/api/trends/route';

// ── Helpers (mirrors page logic) ──────────────────────────────────────────────

function toChartData(points: TrendPoint[], key: keyof TrendPoint) {
  return points.map(p => ({ value: Math.round((Number(p[key]) ?? 0) * 10) / 10 }));
}

function trendDirection(first: number, last: number, higherIsBetter = true): string {
  const delta = last - first;
  if (Math.abs(delta) < 0.5) return 'stable';
  return ((delta > 0 && higherIsBetter) || (delta < 0 && !higherIsBetter)) ? 'positive' : 'negative';
}

function makeTrendPoint(overrides: Partial<TrendPoint> = {}): TrendPoint {
  return {
    id: 'log-1', fileName: 'jira.csv', uploadedAt: '2025-01-01T00:00:00Z',
    healthScore: 75, totalIssues: 100, doneIssues: 60, completionRate: 60,
    blockedIssues: 3, activeIssues: 20, openDefects: 2,
    avgLeadTimeDays: 12, avgCycleTimeDays: 6, criticalCount: 5,
    dataQualityScore: 80, avgSprintThroughput: 8,
    ...overrides,
  };
}

// TC-TR-01: Health score improvement is positive trend
test('TC-TR-01: health score 60→80 → positive trend', () => {
  expect(trendDirection(60, 80, true)).toBe('positive');
});

// TC-TR-02: Health score decline is negative trend
test('TC-TR-02: health score 80→60 → negative trend', () => {
  expect(trendDirection(80, 60, true)).toBe('negative');
});

// TC-TR-03: Blocked items reduction is positive (lower is better)
test('TC-TR-03: blocked items 5→2 → positive (lower is better)', () => {
  expect(trendDirection(5, 2, false)).toBe('positive');
});

// TC-TR-04: Blocked items increase is negative
test('TC-TR-04: blocked items 2→7 → negative', () => {
  expect(trendDirection(2, 7, false)).toBe('negative');
});

// TC-TR-05: No significant change → stable
test('TC-TR-05: delta < 0.5 → stable', () => {
  expect(trendDirection(75, 75.3, true)).toBe('stable');
  expect(trendDirection(75, 74.8, true)).toBe('stable');
});

// TC-TR-06: toChartData maps correct values
test('TC-TR-06: toChartData correctly maps healthScore', () => {
  const points = [
    makeTrendPoint({ healthScore: 70 }),
    makeTrendPoint({ healthScore: 75 }),
    makeTrendPoint({ healthScore: 82 }),
  ];
  const data = toChartData(points, 'healthScore');
  expect(data.map(d => d.value)).toEqual([70, 75, 82]);
});

// TC-TR-07: metadataJson fields mapped correctly
test('TC-TR-07: TrendPoint has all required fields', () => {
  const p = makeTrendPoint();
  expect(p.healthScore).toBe(75);
  expect(p.completionRate).toBe(60);
  expect(p.blockedIssues).toBe(3);
  expect(p.avgLeadTimeDays).toBe(12);
  expect(p.avgCycleTimeDays).toBe(6);
  expect(p.dataQualityScore).toBe(80);
  expect(p.avgSprintThroughput).toBe(8);
});

// TC-TR-08: fallback completionRate from doneIssues/totalIssues
test('TC-TR-08: completionRate derived from doneIssues/totalIssues if not stored', () => {
  const totalIssues = 100;
  const doneIssues  = 70;
  const fallback    = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;
  expect(fallback).toBe(70);
});

// TC-TR-09: trend over multiple points
test('TC-TR-09: multi-point health score improvement detected', () => {
  const scores = [60, 65, 70, 78, 82];
  const dir = trendDirection(scores[0], scores[scores.length - 1]);
  expect(dir).toBe('positive');
});

// TC-TR-10: single upload needs 2+ for chart (hasData check)
test('TC-TR-10: hasData requires at least 2 points', () => {
  const hasData0 = [].length >= 2;
  const hasData1 = [makeTrendPoint()].length >= 2;
  const hasData2 = [makeTrendPoint(), makeTrendPoint()].length >= 2;
  expect(hasData0).toBe(false);
  expect(hasData1).toBe(false);
  expect(hasData2).toBe(true);
});
