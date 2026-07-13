// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Delivery forecast engine — TC-FCAST-01 to TC-FCAST-13 (FCAST-19 to FCAST-24)
// TC-FCAST-01–05 IDs match product/TEST_CASES.md §9.55 (manual scenarios already
// documented there); TC-FCAST-06 onward are new automated cases for this change.

import { computeForecast } from '@/services/forecast/forecastEngine.service';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import type { MetricConfidence, MetricConfidenceMap } from '@/types/metricConfidence';
import type { DataQualityResult, DataQualityBand } from '@/types/dataQuality';
import type { SprintThroughput } from '@/types/throughput';

function flowItem(key: string, overrides: Partial<FlowItem> = {}): FlowItem {
  return {
    key, summary: `Summary ${key}`, type: 'Story', status: 'In Progress', highLevelStatus: 'In Progress',
    sprint: 'Sprint 1', epic: 'EPIC-1', isOrphan: false, assignee: 'Ali', priority: 'Medium', storyPoints: 3,
    createdDate: '2026-01-01', startedDate: '2026-01-02', doneDate: '', leadTimeDays: null, cycleTimeDays: null,
    ageDays: 5, activeAgeDays: 5, labels: '', parent: '', project: 'PROJ', health: 'good', reason: '',
    fixVersion: '', blocked: false,
    ...overrides,
  };
}

function metricConfidence(overrides: Partial<MetricConfidence> = {}): MetricConfidence {
  return {
    metricKey: 'generic', metricLabel: 'Generic Metric', confidence: 90, band: 'High',
    reason: 'All items have the required fields.', sampleSize: 10, requiredFields: [], missingFields: [],
    ...overrides,
  };
}

function confidenceMap(overrides: Partial<Record<keyof MetricConfidenceMap, Partial<MetricConfidence>>> = {}): MetricConfidenceMap {
  const keys: (keyof MetricConfidenceMap)[] = [
    'leadTime', 'cycleTime', 'sprintThroughput', 'velocity', 'storyPoints',
    'kanbanFlow', 'healthScore', 'orphanRisk', 'midSprint', 'teamCapacity', 'releaseReadiness',
  ];
  const map = {} as MetricConfidenceMap;
  keys.forEach((key) => { map[key] = metricConfidence({ metricKey: key, metricLabel: key, ...overrides[key] }); });
  return map;
}

function dataQuality(band: DataQualityBand = 'Excellent', score = 95): DataQualityResult {
  return { score, band, totalIssues: 10, checks: [], summary: `Data quality is ${band} (${score}/100).`, affectedMetrics: [], criticalCount: 0, highCount: 0 };
}

function sprint(overrides: Partial<SprintThroughput> = {}): SprintThroughput {
  return {
    sprintName: 'Sprint 1', team: '', sprintStart: null, sprintEnd: null, sprintMidpoint: null,
    committedCount: 5, committedPoints: 0, completedCount: 5, completedPoints: 0,
    completionPct: 100, pointCompletionPct: 100, throughputByCount: 5, throughputByPoints: 0,
    midSprintDoneCount: 0, midSprintDonePoints: 0, midSprintPct: 0,
    carryoverCount: 0, addedScopeCount: 0, removedScopeCount: 0,
    blockedCount: 0, bugsCompleted: 0, bugsOpen: 0,
    goalOutcome: 'Met', deliveryPattern: 'Healthy Early Progress', patternInterpretation: '', deliveryConfidence: 80,
    ...overrides,
  };
}

function buildMetrics(overrides: Partial<DashboardMetrics> = {}, sprints: SprintThroughput[] = []): DashboardMetrics {
  const items = overrides.flow?.items ?? [];

  const base: DashboardMetrics = {
    totalIssues: items.length, doneIssues: 0, activeIssues: items.length, blockedIssues: 0, openDefects: 0,
    completionRate: 0, customerVisibleProgress: 0, overallDeliveryConfidence: 70, totalCustomerVisible: 0,
    flow: { issues: items.length, done: 0, good: 0, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
    sprint: { hasSprintData: false, sprintCount: 0, sprints: [] },
    kanban: { byStatus: [], byHighLevelStatus: [] },
    quarters: [], capacity: [], epics: [], labels: {}, types: [], projects: [], parents: [],
    relations: { hasLinks: false, totalLinks: 0, blockedItems: [] },
    risk: { blockedIssues: 0, overdueIssues: 0, highPriorityOpenIssues: 0, openDefects: 0 },
    storyPoints: { totalStoryPoints: 0, completedStoryPoints: 0, remainingStoryPoints: 0, pointCompletionRate: 0 },
    healthScore: 75, prediction: { complete: false, daysRemaining: null }, insights: [],
    throughput: {
      sprint: {
        sprints, totalSprints: sprints.length, totalCommitted: 0, totalCompleted: 0,
        averageThroughputCount: 0, averageThroughputPoints: 0, averageCompletionPct: 0, averageMidSprintPct: 0,
        deliveryTrendValue: 0, trendDirection: 'Stable', bestSprintName: '', worstSprintName: '',
        endLoadedSprintCount: 0, blockedSprintCount: 0, overallDeliveryConfidence: 70,
      },
      kanban: { hasKanbanData: false, periods: [], avgThroughputPerPeriod: 0, avgCycleTimeDays: 0, avgLeadTimeDays: 0, avgFlowEfficiencyPct: 0, totalAgingWip: 0, overallFlowHealth: 'Healthy' },
      midSprint: [],
    },
    dataQuality: dataQuality(),
    fieldImpacts: { hasIssues: false, critical: [], high: [], medium: [], low: [], all: [], topSummary: '' },
    confidence: confidenceMap(),
  };

  return { ...base, ...overrides };
}

// TC-FCAST-01: done >= total -> complete status, high confidence
test('TC-FCAST-01: remaining issues of zero produces complete status', () => {
  const items = [flowItem('A-1', { status: 'Done' }), flowItem('A-2', { status: 'Done' })];
  const metrics = buildMetrics({
    flow: { issues: 2, done: 2, good: 2, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
  }, [sprint()]);
  const result = computeForecast(metrics);
  expect(result.status).toBe('complete');
  expect(result.confidence).toBe('high');
});

// TC-FCAST-02: avgThroughput = 0 -> insufficient_data
test('TC-FCAST-02: zero throughput produces insufficient_data status and a safe message', () => {
  const metrics = buildMetrics({ flow: { issues: 5, done: 0, good: 0, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items: [flowItem('A-1')] } });
  const result = computeForecast(metrics);
  expect(result.status).toBe('insufficient_data');
  expect(result.confidence).toBe('low');
  expect(result.confidenceReason).toMatch(/not available/i);
});

// TC-FCAST-03: sprintsRemaining <= 6 -> on_track
test('TC-FCAST-03: status is on_track when remaining work fits within 6 sprints', () => {
  const items = [...Array(10)].map((_, i) => flowItem(`A-${i}`, { status: i < 5 ? 'Done' : 'In Progress' }));
  const metrics = buildMetrics({
    flow: { issues: 10, done: 5, good: 5, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
  }, [sprint({ completedCount: 5 })]);
  const result = computeForecast(metrics);
  expect(result.status).toBe('on_track');
});

// TC-FCAST-04: 6 < sprintsRemaining <= 12 -> at_risk
test('TC-FCAST-04: status is at_risk when remaining work needs 6-12 sprints', () => {
  const items = [...Array(50)].map((_, i) => flowItem(`A-${i}`, { status: i < 5 ? 'Done' : 'In Progress' }));
  const metrics = buildMetrics({
    flow: { issues: 50, done: 5, good: 5, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
  }, [sprint({ completedCount: 5 })]); // 45 remaining / 5 per sprint = 9 sprints
  const result = computeForecast(metrics);
  expect(result.status).toBe('at_risk');
});

// TC-FCAST-06: off_track when more than 3 items are blocked, even with low sprintsRemaining
test('TC-FCAST-06: status is off_track when more than 3 items are blocked', () => {
  const items = [
    ...[...Array(4)].map((_, i) => flowItem(`B-${i}`, { status: 'Blocked' })),
    ...[...Array(6)].map((_, i) => flowItem(`C-${i}`, { status: 'In Progress' })),
  ];
  const metrics = buildMetrics({
    flow: { issues: 10, done: 0, good: 0, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
  }, [sprint({ completedCount: 2 })]);
  const result = computeForecast(metrics);
  expect(result.status).toBe('off_track');
  expect(result.blockedCount).toBe(4);
});

// TC-FCAST-07: current throughput is computed from throughput.sprint.sprints
test('TC-FCAST-07: average throughput is computed from throughput.sprint.sprints', () => {
  const items = [...Array(20)].map((_, i) => flowItem(`A-${i}`, { status: i < 10 ? 'Done' : 'In Progress' }));
  const metrics = buildMetrics({
    flow: { issues: 20, done: 10, good: 10, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
  }, [sprint({ sprintName: 'Sprint 1', completedCount: 4 }), sprint({ sprintName: 'Sprint 2', completedCount: 6 })]);
  const result = computeForecast(metrics);
  expect(result.avgThroughput).toBe(5);
});

// TC-FCAST-08 / FCAST-23: Critical Data Quality downgrades confidence and is cited in the reason
test('TC-FCAST-08: Critical Data Quality downgrades confidence relative to Excellent', () => {
  const items = [...Array(20)].map((_, i) => flowItem(`A-${i}`, { status: i < 10 ? 'Done' : 'In Progress' }));
  const goodSprints = [...Array(5)].map((_, i) => sprint({ sprintName: `Sprint ${i}`, completedCount: 5 }));
  const flow = { issues: 20, done: 10, good: 10, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items };

  const highQuality = computeForecast(buildMetrics({ flow, dataQuality: dataQuality('Excellent', 95) }, goodSprints));
  const criticalQuality = computeForecast(buildMetrics({ flow, dataQuality: dataQuality('Critical', 20) }, goodSprints));

  expect(criticalQuality.confidenceReason).toMatch(/Critical/);
  expect(['low', 'medium']).toContain(criticalQuality.confidence);
  // Critical data quality must never produce a *higher* confidence band than excellent data quality with identical structural signals.
  const order = { low: 0, medium: 1, high: 2 };
  expect(order[criticalQuality.confidence]).toBeLessThanOrEqual(order[highQuality.confidence]);
});

// TC-FCAST-09 / FCAST-20: weakest factor — severe blockers take priority
test('TC-FCAST-09: more than 3 blocked items are identified as the weakest factor', () => {
  const items = [
    ...[...Array(5)].map((_, i) => flowItem(`B-${i}`, { status: 'Blocked' })),
    ...[...Array(5)].map((_, i) => flowItem(`C-${i}`, { status: 'In Progress' })),
  ];
  const metrics = buildMetrics({
    flow: { issues: 10, done: 0, good: 0, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
  }, [sprint({ completedCount: 3 })]);
  const result = computeForecast(metrics);
  expect(result.weakestFactor.kind).toBe('blockers');
});

// TC-FCAST-10 / FCAST-20/16: weakest factor — scope growth, when no severe blockers exist
test('TC-FCAST-10: heavy mid-sprint scope addition is identified as the weakest factor', () => {
  const items = [...Array(10)].map((_, i) => flowItem(`A-${i}`, { status: i < 5 ? 'Done' : 'In Progress' }));
  const metrics = buildMetrics({
    flow: { issues: 10, done: 5, good: 5, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
  }, [sprint({ sprintName: 'Sprint 1', completedCount: 5, addedScopeCount: 15 })]);
  const result = computeForecast(metrics);
  expect(result.weakestFactor.kind).toBe('scope');
  expect(result.adjustments.some(a => /added mid-sprint/i.test(a))).toBe(true);
});

// TC-FCAST-11 / FCAST-16/17: scopeTrend reflects per-sprint added/removed/blocked counts
test('TC-FCAST-11: scopeTrend reflects per-sprint added/removed/blocked counts', () => {
  const items = [...Array(10)].map((_, i) => flowItem(`A-${i}`, { status: i < 5 ? 'Done' : 'In Progress' }));
  const metrics = buildMetrics({
    flow: { issues: 10, done: 5, good: 5, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
  }, [sprint({ sprintName: 'Sprint 1', completedCount: 5, addedScopeCount: 2, removedScopeCount: 1, blockedCount: 3 })]);
  const result = computeForecast(metrics);
  expect(result.scopeTrend).toEqual([{ sprint: 'Sprint 1', added: 2, removed: 1, blocked: 3 }]);
});

// TC-FCAST-12: scopeTrend is empty when only legacy 8-sprint-capped data is available
test('TC-FCAST-12: scopeTrend is empty when only legacy sprint data is available', () => {
  const items = [...Array(10)].map((_, i) => flowItem(`A-${i}`, { status: i < 5 ? 'Done' : 'In Progress' }));
  const metrics = buildMetrics({
    flow: { issues: 10, done: 5, good: 5, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items },
    sprint: { hasSprintData: true, sprintCount: 1, sprints: [{ name: 'Sprint 1', issues: 5, completedIssues: 5, committedPoints: 0, completedPoints: 0, completionRate: 100, pointCompletionRate: 100, done: 5, good: 5, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0 }] },
  });
  const result = computeForecast(metrics);
  expect(result.scopeTrend).toEqual([]);
});

// TC-FCAST-13: zero issues entirely produces insufficient_data, not a crash
test('TC-FCAST-13: zero issues produces insufficient_data without throwing', () => {
  const result = computeForecast(buildMetrics());
  expect(result.status).toBe('insufficient_data');
  expect(result.totalIssues).toBe(0);
});
