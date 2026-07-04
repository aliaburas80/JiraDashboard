// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Portfolio health tests — TC-PF-01 to TC-PF-10

import { computePortfolioSummary, portfolioBand, portfolioBandColor } from '../lib/portfolioHealth';
import type { DashboardMetrics } from '../types/metrics';

// ── Minimal metrics fixture ───────────────────────────────────────────────────

function makeMetrics(overrides: Partial<DashboardMetrics> = {}): DashboardMetrics {
  return {
    totalIssues: 30,
    doneIssues: 21,
    activeIssues: 6,
    blockedIssues: 2,
    openDefects: 1,
    completionRate: 70,
    customerVisibleProgress: 70,
    overallDeliveryConfidence: 72,
    totalCustomerVisible: 15,
    healthScore: 72,
    flow: {
      issues: 30, done: 21, good: 15, warning: 6, critical: 3,
      averageLeadTimeDays: 8, averageCycleTimeDays: 4,
      leadTimeSampleSize: 20, cycleTimeSampleSize: 15,
      items: [],
    },
    sprint: { hasSprintData: true, sprintCount: 2, sprints: [] },
    kanban: { byStatus: [], byHighLevelStatus: [] },
    quarters: [
      { quarter: '2025 Q1', issues: 10, doneIssues: 8, completionRate: 80, storyPoints: 0, completedStoryPoints: 0, pointCompletionRate: 80, statusBreakdown: [], activeIssues: 2 },
      { quarter: '2025 Q2', issues: 20, doneIssues: 13, completionRate: 65, storyPoints: 0, completedStoryPoints: 0, pointCompletionRate: 65, statusBreakdown: [], activeIssues: 7 },
    ],
    capacity: [],
    epics: [
      { epic: 'Epic Alpha', issues: 10, completedIssues: 8, storyPoints: 20, doneStoryPoints: 16, progress: 80, pointProgress: 80, critical: 0, warning: 1, good: 2 },
      { epic: 'Epic Beta',  issues: 10, completedIssues: 3, storyPoints: 15, doneStoryPoints: 5,  progress: 30, pointProgress: 33, critical: 2, warning: 1, good: 1 },
      { epic: 'Epic Gamma', issues: 10, completedIssues: 10, storyPoints: 25, doneStoryPoints: 25, progress: 100, pointProgress: 100, critical: 0, warning: 0, good: 0 },
    ],
    labels: {},
    types: [],
    projects: [
      { project: 'PROJ-A', count: 20, done: 16, completionRate: 80, storyPoints: 30 },
      { project: 'PROJ-B', count: 10, done:  5, completionRate: 50, storyPoints: 10 },
    ],
    parents: [],
    relations: { hasLinks: false, totalLinks: 0, itemsWithLinks: 0, linkTypes: 0, linkStats: [] },
    risk: { blockedIssues: 2, overdueIssues: 1, highPriorityOpenIssues: 2, openDefects: 1 },
    storyPoints: { totalStoryPoints: 60, completedStoryPoints: 46, remainingStoryPoints: 14, pointCompletionRate: 77 },
    prediction: { complete: false, daysRemaining: 5, predictedDate: '2025-08-01' },
    insights: ['Delivery progressing.'],
    throughput: {
      sprint: {
        sprints: [], totalSprints: 2, totalCommitted: 20, totalCompleted: 14,
        averageThroughputCount: 7, averageThroughputPoints: 14, averageCompletionPct: 70,
        averageMidSprintPct: 40, deliveryTrendValue: 1, trendDirection: 'Improving',
        bestSprintName: 'Sprint 1', worstSprintName: 'Sprint 2',
        endLoadedSprintCount: 0, blockedSprintCount: 0, overallDeliveryConfidence: 72,
      },
      kanban: { hasKanbanData: false, periods: [], avgThroughputPerPeriod: 0, avgCycleTimeDays: 0, avgLeadTimeDays: 0, avgFlowEfficiencyPct: 0, totalAgingWip: 0, overallFlowHealth: 'Healthy' },
      midSprint: [],
    },
    dataQuality: { score: 80, band: 'Good' as const, totalIssues: 30, checks: [], summary: 'Good', affectedMetrics: [], criticalCount: 0, highCount: 0 },
    fieldImpacts: { hasIssues: false, critical: [], high: [], medium: [], low: [], all: [], topSummary: '' } as any,
    confidence: {} as any,
    ...overrides,
  };
}

// ── TC-PF-01: Score is in range 0-100 ────────────────────────────────────────

test('TC-PF-01: portfolioScore is between 0 and 100', () => {
  const s = computePortfolioSummary(makeMetrics());
  expect(s.portfolioScore).toBeGreaterThanOrEqual(0);
  expect(s.portfolioScore).toBeLessThanOrEqual(100);
});

// ── TC-PF-02: Epic fields mapped correctly ────────────────────────────────────

test('TC-PF-02: epics are mapped with correct fields', () => {
  const s = computePortfolioSummary(makeMetrics());
  expect(s.epics).toHaveLength(3);
  expect(s.epics[0].name).toBe('Epic Alpha');
  expect(s.epics[0].progress).toBe(80);
  expect(s.epics[0].health).toBe('warning');   // has warning items
  expect(s.epics[1].health).toBe('critical');  // has critical items
  expect(s.epics[2].health).toBe('good');      // all done, no issues
});

// ── TC-PF-03: Projects mapped correctly ──────────────────────────────────────

test('TC-PF-03: projects mapped with health bands', () => {
  const s = computePortfolioSummary(makeMetrics());
  expect(s.projects).toHaveLength(2);
  expect(s.projects[0].name).toBe('PROJ-A');
  expect(s.projects[0].health).toBe('good');      // 80% ≥ 70
  expect(s.projects[1].health).toBe('warning');   // 50% < 70 but ≥ 40
});

// ── TC-PF-04: Quarters filtered — 'No date' excluded ─────────────────────────

test('TC-PF-04: No date quarter is excluded from quarters array', () => {
  const m = makeMetrics({
    quarters: [
      { quarter: 'No date', issues: 5, doneIssues: 3, completionRate: 60, storyPoints: 0, completedStoryPoints: 0, pointCompletionRate: 60, statusBreakdown: [], activeIssues: 2 },
      { quarter: '2025 Q1', issues: 10, doneIssues: 8, completionRate: 80, storyPoints: 0, completedStoryPoints: 0, pointCompletionRate: 80, statusBreakdown: [], activeIssues: 2 },
    ] as any,
  });
  const s = computePortfolioSummary(m);
  expect(s.quarters.every(q => q.quarter !== 'No date')).toBe(true);
  expect(s.quarters).toHaveLength(1);
});

// ── TC-PF-05: atRiskEpics counts epics with critical items ───────────────────

test('TC-PF-05: atRiskEpics counts epics with critical > 0', () => {
  const s = computePortfolioSummary(makeMetrics());
  expect(s.atRiskEpics).toBe(1); // only Epic Beta has critical > 0
});

// ── TC-PF-06: healthyProjects counts projects with completionRate >= 70 ───────

test('TC-PF-06: healthyProjects counts projects with completionRate >= 70', () => {
  const s = computePortfolioSummary(makeMetrics());
  expect(s.healthyProjects).toBe(1); // PROJ-A: 80%; PROJ-B: 50%
  expect(s.atRiskProjects).toBe(1);
});

// ── TC-PF-07: Insights array is non-empty ─────────────────────────────────────

test('TC-PF-07: insights array has at least one entry', () => {
  const s = computePortfolioSummary(makeMetrics());
  expect(s.insights.length).toBeGreaterThan(0);
  s.insights.forEach(i => expect(typeof i).toBe('string'));
});

// ── TC-PF-08: Perfect delivery → score near 100, band Excellent ──────────────

test('TC-PF-08: perfect delivery produces Excellent band', () => {
  const m = makeMetrics({
    completionRate: 100,
    blockedIssues: 0,
    epics: [
      { epic: 'Done Epic', issues: 10, completedIssues: 10, storyPoints: 0, doneStoryPoints: 0, progress: 100, pointProgress: 100, critical: 0, warning: 0, good: 10 },
    ] as any,
    projects: [
      { project: 'PROJ', count: 10, done: 10, completionRate: 100, storyPoints: 0 },
    ] as any,
    throughput: { sprint: { averageCompletionPct: 100, sprints: [], totalSprints: 1, totalCommitted: 10, totalCompleted: 10, averageThroughputCount: 10, averageThroughputPoints: 10, averageMidSprintPct: 60, deliveryTrendValue: 2, trendDirection: 'Improving', bestSprintName: 'S1', worstSprintName: 'S1', endLoadedSprintCount: 0, blockedSprintCount: 0, overallDeliveryConfidence: 100 }, kanban: { hasKanbanData: false, periods: [], avgThroughputPerPeriod: 0, avgCycleTimeDays: 0, avgLeadTimeDays: 0, avgFlowEfficiencyPct: 0, totalAgingWip: 0, overallFlowHealth: 'Healthy' }, midSprint: [] },
    dataQuality: { score: 100, band: 'Excellent' as const, totalIssues: 10, checks: [], summary: 'Excellent', affectedMetrics: [], criticalCount: 0, highCount: 0 },
  });
  const s = computePortfolioSummary(m);
  expect(s.portfolioScore).toBe(100);
  expect(s.band).toBe('Excellent');
});

// ── TC-PF-09: Empty epics/projects fallback to overall completionRate ─────────

test('TC-PF-09: empty epics and projects fall back to overall completionRate', () => {
  const m = makeMetrics({ epics: [], projects: [] });
  const s = computePortfolioSummary(m);
  // Should not throw and should still produce a valid score
  expect(s.portfolioScore).toBeGreaterThanOrEqual(0);
  expect(s.epics).toHaveLength(0);
  expect(s.projects).toHaveLength(0);
});

// ── TC-PF-10: portfolioBand and portfolioBandColor helpers ───────────────────

test('TC-PF-10: portfolioBand thresholds and colors are correct', () => {
  expect(portfolioBand(100)).toBe('Excellent');
  expect(portfolioBand(85)).toBe('Excellent');
  expect(portfolioBand(84)).toBe('Good');
  expect(portfolioBand(70)).toBe('Good');
  expect(portfolioBand(69)).toBe('Moderate');
  expect(portfolioBand(55)).toBe('Moderate');
  expect(portfolioBand(54)).toBe('At Risk');
  expect(portfolioBand(35)).toBe('At Risk');
  expect(portfolioBand(34)).toBe('Critical');
  expect(portfolioBand(0)).toBe('Critical');

  expect(portfolioBandColor('Excellent')).toBe('#16a34a');
  expect(portfolioBandColor('Critical')).toBe('#dc2626');
  expect(portfolioBandColor('At Risk')).toBe('#ea580c');
});
