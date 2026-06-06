// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Executive PDF export tests — TC-EP-01 to TC-EP-08

import { buildExecutivePdfHtml } from '../lib/executivePdf';
import type { DashboardMetrics } from '../types/metrics';

// ── Fixture ───────────────────────────────────────────────────────────────────

function makeMetrics(overrides: Partial<DashboardMetrics> = {}): DashboardMetrics {
  return {
    totalIssues: 20,
    doneIssues: 14,
    activeIssues: 4,
    blockedIssues: 2,
    openDefects: 1,
    completionRate: 70,
    customerVisibleProgress: 70,
    overallDeliveryConfidence: 72,
    totalCustomerVisible: 10,
    healthScore: 72,
    flow: {
      issues: 20, done: 14, good: 10, warning: 4, critical: 2,
      averageLeadTimeDays: 8, averageCycleTimeDays: 4,
      leadTimeSampleSize: 14, cycleTimeSampleSize: 10,
      items: [],
    },
    sprint: { hasSprintData: false, sprintCount: 0, sprints: [] },
    kanban: { byStatus: [], byHighLevelStatus: [] },
    quarters: [],
    capacity: [
      { assignee: 'Alice', issues: 10, activeIssues: 3, doneIssues: 8, storyPoints: 20, doneStoryPoints: 14, loadShare: 40 },
      { assignee: 'Bob',   issues: 10, activeIssues: 1, doneIssues: 6, storyPoints: 10, doneStoryPoints: 6,  loadShare: 30 },
    ],
    epics: [
      { epic: 'Payments v2', issues: 10, completedIssues: 7, progress: 70, pointProgress: 70, storyPoints: 20, doneStoryPoints: 14, critical: 0, warning: 1, good: 3 },
      { epic: 'Auth Revamp', issues: 10, completedIssues: 4, progress: 40, pointProgress: 40, storyPoints: 10, doneStoryPoints: 4,  critical: 2, warning: 0, good: 1 },
    ],
    labels: {},
    types: [{ type: 'Story', count: 12 }, { type: 'Bug', count: 3 }],
    projects: [],
    parents: [],
    relations: { hasLinks: false, totalLinks: 0, itemsWithLinks: 0, linkTypes: 0, linkStats: [] },
    risk: { blockedIssues: 2, overdueIssues: 1, highPriorityOpenIssues: 2, openDefects: 1 },
    storyPoints: { totalStoryPoints: 40, completedStoryPoints: 28, remainingStoryPoints: 12, pointCompletionRate: 70 },
    prediction: { complete: false, daysRemaining: 5, predictedDate: '2025-08-01' },
    insights: ['14 items are done (70%).', '2 items are blocked.'],
    throughput: {
      sprint: { sprints: [], totalSprints: 0, totalCommitted: 0, totalCompleted: 0, averageThroughputCount: 0, averageThroughputPoints: 0, averageCompletionPct: 0, averageMidSprintPct: 0, deliveryTrendValue: 0, trendDirection: 'Stable', bestSprintName: '', worstSprintName: '', endLoadedSprintCount: 0, blockedSprintCount: 0, overallDeliveryConfidence: 0 },
      kanban: { hasKanbanData: false, periods: [], avgThroughputPerPeriod: 0, avgCycleTimeDays: 0, avgLeadTimeDays: 0, avgFlowEfficiencyPct: 0, totalAgingWip: 0, overallFlowHealth: 'Healthy' },
      midSprint: [],
    },
    dataQuality: { score: 80, band: 'Good' as const, totalIssues: 20, checks: [], summary: 'Good', affectedMetrics: [], criticalCount: 0, highCount: 0 },
    fieldImpacts: { hasIssues: false, critical: [], high: [], medium: [], low: [], all: [], topSummary: '' } as any,
    confidence: {} as any,
    ...overrides,
  };
}

// ── TC-EP-01: Returns valid HTML string ───────────────────────────────────────

test('TC-EP-01: buildExecutivePdfHtml returns a non-empty HTML string', () => {
  const html = buildExecutivePdfHtml(makeMetrics());
  expect(typeof html).toBe('string');
  expect(html.length).toBeGreaterThan(500);
  expect(html).toContain('<!DOCTYPE html>');
  expect(html).toContain('</html>');
});

// ── TC-EP-02: Health score and band present ───────────────────────────────────

test('TC-EP-02: HTML contains health score and band label', () => {
  const html = buildExecutivePdfHtml(makeMetrics({ healthScore: 72 }));
  expect(html).toContain('72');
  expect(html).toContain('Moderate');
});

// ── TC-EP-03: Completion rate present ────────────────────────────────────────

test('TC-EP-03: HTML contains completion rate', () => {
  const html = buildExecutivePdfHtml(makeMetrics({ completionRate: 70 }));
  expect(html).toContain('70%');
});

// ── TC-EP-04: Epic names present ─────────────────────────────────────────────

test('TC-EP-04: HTML contains epic names', () => {
  const html = buildExecutivePdfHtml(makeMetrics());
  expect(html).toContain('Payments v2');
  expect(html).toContain('Auth Revamp');
});

// ── TC-EP-05: Assignee names present ─────────────────────────────────────────

test('TC-EP-05: HTML contains assignee names from capacity', () => {
  const html = buildExecutivePdfHtml(makeMetrics());
  expect(html).toContain('Alice');
  expect(html).toContain('Bob');
});

// ── TC-EP-06: Insights present ───────────────────────────────────────────────

test('TC-EP-06: HTML contains insight text', () => {
  const html = buildExecutivePdfHtml(makeMetrics());
  expect(html).toContain('14 items are done (70%).');
  expect(html).toContain('2 items are blocked.');
});

// ── TC-EP-07: Print CSS present ──────────────────────────────────────────────

test('TC-EP-07: HTML contains print CSS and @page rule', () => {
  const html = buildExecutivePdfHtml(makeMetrics());
  expect(html).toContain('@media print');
  expect(html).toContain('@page');
  expect(html).toContain('print-color-adjust');
});

// ── TC-EP-08: No raw HTML injection from user data ────────────────────────────

test('TC-EP-08: XSS-sensitive characters in epic names are escaped', () => {
  const m = makeMetrics({
    epics: [
      { epic: '<script>alert("xss")</script>', issues: 5, completedIssues: 2, progress: 40, pointProgress: 40, storyPoints: 0, doneStoryPoints: 0, critical: 0, warning: 0, good: 2 },
    ] as any,
  });
  const html = buildExecutivePdfHtml(m);
  expect(html).not.toContain('<script>');
  expect(html).toContain('&lt;script&gt;');
});
