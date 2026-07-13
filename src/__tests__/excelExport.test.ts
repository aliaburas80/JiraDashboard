// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Excel export tests — TC-X-01 to TC-X-06

import * as XLSX from 'xlsx';
import { buildInsightWorkbook } from '../services/export/excelInsightExport.service';
import { generateRecommendations, generateExecutiveNarrative } from '../services/export/recommendationEngine';
import type { DashboardMetrics } from '../types/metrics';

// ── Minimal valid metrics fixture ─────────────────────────────────────────────

function makeMetrics(overrides: Partial<DashboardMetrics> = {}): DashboardMetrics {
  const base: DashboardMetrics = {
    totalIssues: 20,
    doneIssues: 14,
    activeIssues: 4,
    blockedIssues: 2,
    openDefects: 1,
    completionRate: 70,
    customerVisibleProgress: 70,
    overallDeliveryConfidence: 75,
    totalCustomerVisible: 10,
    healthScore: 72,
    flow: {
      issues: 20, done: 14, good: 10, warning: 4, critical: 2,
      averageLeadTimeDays: 8, averageCycleTimeDays: 4,
      leadTimeSampleSize: 14, cycleTimeSampleSize: 10,
      items: [
        { key: 'PROJ-1', summary: 'Test story', type: 'Story', status: 'Done',
          highLevelStatus: 'Done', sprint: 'Sprint 1', epic: 'EPIC-1',
          isOrphan: false, assignee: 'Ali', priority: 'High', storyPoints: 5,
          createdDate: '2025-01-01', startedDate: '2025-01-05', doneDate: '2025-01-10',
          leadTimeDays: 9, cycleTimeDays: 5, ageDays: null, activeAgeDays: null,
          labels: '', parent: '', project: 'PROJ', health: 'good', reason: 'Completed',
          fixVersion: '', blocked: false },
        { key: 'PROJ-2', summary: 'Blocked task', type: 'Task', status: 'In Progress',
          highLevelStatus: 'Active', sprint: 'Sprint 1', epic: 'EPIC-1',
          isOrphan: false, assignee: 'Ali', priority: 'Critical', storyPoints: 3,
          createdDate: '2025-01-01', startedDate: '2025-01-05', doneDate: '',
          leadTimeDays: null, cycleTimeDays: null, ageDays: 20, activeAgeDays: 20,
          labels: '', parent: '', project: 'PROJ', health: 'critical', reason: 'Blocked flag is set.',
          fixVersion: '', blocked: true },
        { key: 'PROJ-3', summary: 'Orphan item', type: 'Story', status: 'Open',
          highLevelStatus: 'Open', sprint: '', epic: '',
          isOrphan: true, assignee: 'Unassigned', priority: 'Low', storyPoints: 0,
          createdDate: '2025-01-01', startedDate: '', doneDate: '',
          leadTimeDays: null, cycleTimeDays: null, ageDays: 30, activeAgeDays: null,
          labels: '', parent: '', project: 'PROJ', health: 'warning', reason: 'No epic or parent.',
          fixVersion: '', blocked: false },
      ],
    },
    sprint: {
      hasSprintData: true,
      sprintCount: 2,
      sprints: [
        { name: 'Sprint 1', issues: 10, completedIssues: 8, committedPoints: 20, completedPoints: 16,
          completionRate: 80, pointCompletionRate: 80,
          done: 8, good: 6, warning: 1, critical: 1,
          averageLeadTimeDays: 8, averageCycleTimeDays: 4, leadTimeSampleSize: 8, cycleTimeSampleSize: 6 },
        { name: 'Sprint 2', issues: 10, completedIssues: 6, committedPoints: 18, completedPoints: 12,
          completionRate: 60, pointCompletionRate: 67,
          done: 6, good: 4, warning: 2, critical: 1,
          averageLeadTimeDays: 9, averageCycleTimeDays: 5, leadTimeSampleSize: 6, cycleTimeSampleSize: 5 },
      ],
    },
    kanban: { byStatus: [], byHighLevelStatus: [] },
    quarters: [],
    capacity: [{ assignee: 'Ali', issues: 10, activeIssues: 4, doneIssues: 6, storyPoints: 20, doneStoryPoints: 14, loadShare: 50 }],
    epics: [],
    labels: {},
    types: [{ type: 'Story', count: 12 }, { type: 'Task', count: 5 }, { type: 'Bug', count: 3 }],
    projects: [],
    parents: [],
    relations: { hasLinks: false, totalLinks: 0, itemsWithLinks: 0, linkTypes: 0, linkStats: [] },
    risk: { blockedIssues: 2, overdueIssues: 1, highPriorityOpenIssues: 2, openDefects: 1 },
    storyPoints: { totalStoryPoints: 40, completedStoryPoints: 28, remainingStoryPoints: 12, pointCompletionRate: 70 },
    prediction: { complete: false, daysRemaining: 5, predictedDate: '2025-02-01' },
    insights: ['Delivery is progressing.', '2 items are blocked.'],
    throughput: {
      sprint: {
        sprints: [], totalSprints: 2, totalCommitted: 20, totalCompleted: 14,
        averageThroughputCount: 7, averageThroughputPoints: 14, averageCompletionPct: 70,
        averageMidSprintPct: 40, deliveryTrendValue: 1, trendDirection: 'Improving',
        bestSprintName: 'Sprint 1', worstSprintName: 'Sprint 2',
        endLoadedSprintCount: 0, blockedSprintCount: 0, overallDeliveryConfidence: 72,
      },
      kanban: {
        hasKanbanData: false, periods: [], avgThroughputPerPeriod: 0,
        avgCycleTimeDays: 0, avgLeadTimeDays: 0, avgFlowEfficiencyPct: 0,
        totalAgingWip: 0, overallFlowHealth: 'Healthy',
      },
      midSprint: [],
    },
    dataQuality: {
      score: 85, band: 'Good' as const, totalIssues: 20,
      checks: [], summary: 'Good data quality.', affectedMetrics: [],
      criticalCount: 0, highCount: 0,
    },
    fieldImpacts: { hasIssues: false, critical: [], high: [], medium: [], low: [], all: [], topSummary: '' } as any,
    confidence: {} as any,
    ...overrides,
  };
  return base;
}

// ── TC-X-01: Workbook has all 17 sheets ───────────────────────────────────────

test('TC-X-01: workbook contains exactly 17 sheets', () => {
  const wb = buildInsightWorkbook(makeMetrics());
  expect(wb.SheetNames).toHaveLength(17);
});

test('TC-X-01b: sheet names match expected names', () => {
  const wb = buildInsightWorkbook(makeMetrics());
  expect(wb.SheetNames[0]).toBe('01 Executive Summary');
  expect(wb.SheetNames[3]).toBe('04 Sprint Throughput');
  expect(wb.SheetNames[12]).toBe('13 Recommendations');
  expect(wb.SheetNames[15]).toBe('16 Metric Dictionary');
  expect(wb.SheetNames[16]).toBe('17 Raw Data Reference');
});

// ── TC-X-02: Executive Summary content ────────────────────────────────────────

test('TC-X-02a: Executive Summary contains health score', () => {
  const metrics = makeMetrics({ healthScore: 72 });
  const wb  = buildInsightWorkbook(metrics);
  const ws  = wb.Sheets['01 Executive Summary'];
  const csv = XLSX.utils.sheet_to_csv(ws);
  expect(csv).toContain('72');
  expect(csv).toContain('Health Score');
});

test('TC-X-02b: Executive Summary contains completion rate', () => {
  const metrics = makeMetrics({ completionRate: 70 });
  const wb  = buildInsightWorkbook(metrics);
  const ws  = wb.Sheets['01 Executive Summary'];
  const csv = XLSX.utils.sheet_to_csv(ws);
  expect(csv).toContain('70%');
});

test('TC-X-02c: Executive Summary contains total issues count', () => {
  const metrics = makeMetrics({ totalIssues: 20 });
  const wb  = buildInsightWorkbook(metrics);
  const ws  = wb.Sheets['01 Executive Summary'];
  const csv = XLSX.utils.sheet_to_csv(ws);
  expect(csv).toContain('20');
});

// ── TC-X-03: Recommendations sheet ───────────────────────────────────────────

test('TC-X-03a: recommendations generated when blocked items exist', () => {
  const metrics = makeMetrics({ blockedIssues: 4 });
  const recs = generateRecommendations(metrics);
  expect(recs.length).toBeGreaterThan(0);
  const critical = recs.filter(r => r.priority === 'Critical');
  expect(critical.length).toBeGreaterThan(0);
});

test('TC-X-03b: every recommendation has evidence and suggested action', () => {
  const metrics = makeMetrics({ blockedIssues: 4, openDefects: 5 });
  const recs = generateRecommendations(metrics);
  recs.forEach(rec => {
    expect(rec.evidence.length).toBeGreaterThan(0);
    expect(rec.suggestedAction.length).toBeGreaterThan(0);
    expect(rec.suggestedOwner.length).toBeGreaterThan(0);
    expect(['Critical', 'High', 'Medium', 'Low']).toContain(rec.priority);
  });
});

test('TC-X-03c: Recommendations sheet has header row', () => {
  const wb  = buildInsightWorkbook(makeMetrics({ blockedIssues: 3 }));
  const ws  = wb.Sheets['13 Recommendations'];
  const csv = XLSX.utils.sheet_to_csv(ws);
  expect(csv).toContain('Priority');
  expect(csv).toContain('Recommendation');
  expect(csv).toContain('Evidence');
});

// ── TC-X-04: All sheets have header (auto-filter) ─────────────────────────────

test('TC-X-04: sheets with tabular data have auto-filter set', () => {
  const wb = buildInsightWorkbook(makeMetrics());
  const sheetsWithFilter = ['04 Sprint Throughput', '07 Risks and Blockers', '13 Recommendations', '16 Metric Dictionary', '17 Raw Data Reference'];
  sheetsWithFilter.forEach(name => {
    const ws = wb.Sheets[name];
    expect(ws['!autofilter']).toBeDefined();
  });
});

// ── TC-X-05: Metric Dictionary ────────────────────────────────────────────────

test('TC-X-05a: Metric Dictionary sheet exists and has content', () => {
  const wb  = buildInsightWorkbook(makeMetrics());
  const ws  = wb.Sheets['16 Metric Dictionary'];
  const csv = XLSX.utils.sheet_to_csv(ws);
  expect(csv.length).toBeGreaterThan(100);
});

test('TC-X-05b: Metric Dictionary defines key metrics', () => {
  const wb  = buildInsightWorkbook(makeMetrics());
  const ws  = wb.Sheets['16 Metric Dictionary'];
  const csv = XLSX.utils.sheet_to_csv(ws);
  expect(csv).toContain('Health Score');
  expect(csv).toContain('Lead Time');
  expect(csv).toContain('Cycle Time');
  expect(csv).toContain('Flow Efficiency');
  expect(csv).toContain('Orphan Issue');
});

// ── TC-X-06: No raw HTML or JSON in cells ─────────────────────────────────────

test('TC-X-06: no HTML tags in any cell values', () => {
  const wb = buildInsightWorkbook(makeMetrics());
  wb.SheetNames.forEach(name => {
    const ws  = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(ws);
    expect(csv).not.toMatch(/<[a-z]+[\s>]/i);   // no <div>, <span>, <p> etc.
    expect(csv).not.toContain('className');
    expect(csv).not.toContain('style={{');
  });
});

test('TC-X-06b: no raw JSON objects in cells', () => {
  const wb = buildInsightWorkbook(makeMetrics());
  wb.SheetNames.forEach(name => {
    const ws  = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(ws);
    expect(csv).not.toContain('[object Object]');
  });
});

// ── Executive narrative ───────────────────────────────────────────────────────

test('TC-X-07: executive narrative is a non-empty readable paragraph', () => {
  const metrics  = makeMetrics();
  const recs     = generateRecommendations(metrics);
  const narrative = generateExecutiveNarrative(metrics, recs);
  expect(narrative.length).toBeGreaterThan(50);
  expect(narrative).toContain('20 issues');     // totalIssues
  expect(narrative).toContain('70');            // completionRate
  expect(typeof narrative).toBe('string');
});

// ── Raw Data Reference — no PII summaries by default ─────────────────────────

test('TC-X-08: Raw Data Reference sheet has header columns', () => {
  const wb  = buildInsightWorkbook(makeMetrics());
  const ws  = wb.Sheets['17 Raw Data Reference'];
  const csv = XLSX.utils.sheet_to_csv(ws);
  expect(csv).toContain('Issue Key');
  expect(csv).toContain('Assignee');
  expect(csv).toContain('Health');
});
