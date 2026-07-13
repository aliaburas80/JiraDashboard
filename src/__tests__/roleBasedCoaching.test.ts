// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Role-Based Coaching Insights tests — TC-RBC-01 to TC-RBC-09 (TEST-RBC-01–09)

import type { DashboardMetrics, FlowItem, CapacityEntry } from '@/types/metrics';
import type { MetricConfidenceMap, MetricConfidence, ConfidenceBand } from '@/types/metricConfidence';
import type { DataQualityResult, DataQualityBand } from '@/types/dataQuality';
import { generateAllCoachingInsights, visibleCategoriesForRole } from '@/services/coaching/coachingOrchestrator.service';
import { buildCeremonyAdvice } from '@/services/coaching/ceremonyAdvice.service';
import { generateScrumMasterInsight } from '@/services/coaching/generators/scrumMaster.generator';
import { generateProductOwnerInsight } from '@/services/coaching/generators/productOwner.generator';
import { generateEngineeringManagerInsight } from '@/services/coaching/generators/engineeringManager.generator';
import { generateDeliveryManagerInsight } from '@/services/coaching/generators/deliveryManager.generator';
import { generateTeamLeadInsight } from '@/services/coaching/generators/teamLead.generator';
import { generateCLevelInsight } from '@/services/coaching/generators/cLevel.generator';
import { generateAdminInsight } from '@/services/coaching/generators/admin.generator';

// ── Builders ───────────────────────────────────────────────────────────────────

function flowItem(key: string, overrides: Partial<FlowItem> = {}): FlowItem {
  return {
    key,
    summary: `Summary ${key}`,
    type: 'Story',
    status: 'In Progress',
    highLevelStatus: 'In Progress',
    sprint: 'Sprint 1',
    epic: 'EPIC-1',
    isOrphan: false,
    assignee: 'Ali',
    priority: 'Medium',
    storyPoints: 3,
    createdDate: '2026-01-01',
    startedDate: '2026-01-02',
    doneDate: '',
    leadTimeDays: null,
    cycleTimeDays: null,
    ageDays: 5,
    activeAgeDays: 5,
    labels: '',
    parent: 'EPIC-1',
    project: 'PROJ',
    health: 'good',
    reason: 'Active work is within expected age.',
    fixVersion: '',
    blocked: false,
    ...overrides,
  };
}

function metricConfidence(overrides: Partial<MetricConfidence> = {}): MetricConfidence {
  return {
    metricKey: 'generic',
    metricLabel: 'Generic Metric',
    confidence: 90,
    band: 'High',
    reason: 'All items have the required fields.',
    sampleSize: 10,
    requiredFields: [],
    missingFields: [],
    ...overrides,
  };
}

function confidenceMap(overrides: Partial<Record<keyof MetricConfidenceMap, Partial<MetricConfidence>>> = {}): MetricConfidenceMap {
  const keys: (keyof MetricConfidenceMap)[] = [
    'leadTime', 'cycleTime', 'sprintThroughput', 'velocity', 'storyPoints',
    'kanbanFlow', 'healthScore', 'orphanRisk', 'midSprint', 'teamCapacity', 'releaseReadiness',
  ];
  const map = {} as MetricConfidenceMap;
  keys.forEach((key) => {
    map[key] = metricConfidence({ metricKey: key, metricLabel: key, ...overrides[key] });
  });
  return map;
}

function dataQuality(band: DataQualityBand = 'Excellent', score = 95): DataQualityResult {
  return {
    score,
    band,
    totalIssues: 10,
    checks: [],
    summary: `Data quality is ${band} (${score}/100).`,
    affectedMetrics: [],
    criticalCount: 0,
    highCount: 0,
  };
}

function buildMetrics(overrides: Partial<DashboardMetrics> = {}): DashboardMetrics {
  const items = overrides.flow?.items ?? [flowItem('T-1'), flowItem('T-2', { health: 'critical', reason: 'Blocked flag is set.' })];
  const capacity: CapacityEntry[] = [
    { assignee: 'Ali', issues: 5, activeIssues: 2, doneIssues: 3, storyPoints: 20, doneStoryPoints: 12, loadShare: 50 },
  ];

  const base: DashboardMetrics = {
    totalIssues: items.length,
    doneIssues: items.filter((i) => i.health !== 'critical').length,
    activeIssues: items.length,
    blockedIssues: 0,
    openDefects: 0,
    completionRate: 50,
    customerVisibleProgress: 0,
    overallDeliveryConfidence: 70,
    totalCustomerVisible: 0,
    flow: {
      issues: items.length,
      done: 0,
      good: items.filter((i) => i.health === 'good').length,
      warning: items.filter((i) => i.health === 'warning').length,
      critical: items.filter((i) => i.health === 'critical').length,
      averageLeadTimeDays: 10,
      averageCycleTimeDays: 5,
      leadTimeSampleSize: items.length,
      cycleTimeSampleSize: items.length,
      items,
    },
    sprint: { hasSprintData: true, sprintCount: 1, sprints: [] },
    kanban: { byStatus: [], byHighLevelStatus: [] },
    quarters: [],
    capacity,
    epics: [{ epic: 'EPIC-1', issues: 3, completedIssues: 1, progress: 33, critical: 0 }],
    labels: {},
    types: [],
    projects: [],
    parents: [],
    relations: { hasLinks: false, totalLinks: 0, blockedItems: [] },
    risk: { blockedIssues: 0, overdueIssues: 0, highPriorityOpenIssues: 0, openDefects: 0 },
    storyPoints: { totalStoryPoints: 20, completedStoryPoints: 12, remainingStoryPoints: 8, pointCompletionRate: 60 },
    healthScore: 75,
    prediction: { complete: false, daysRemaining: 10, predictedDate: '1 Jan 2027', velocityPerDay: 0.5 },
    insights: [],
    throughput: {
      sprint: {
        sprints: [],
        totalSprints: 0,
        totalCommitted: 0,
        totalCompleted: 0,
        averageThroughputCount: 5,
        averageThroughputPoints: 15,
        averageCompletionPct: 60,
        averageMidSprintPct: 40,
        deliveryTrendValue: 0,
        trendDirection: 'Stable',
        bestSprintName: '',
        worstSprintName: '',
        endLoadedSprintCount: 0,
        blockedSprintCount: 0,
        overallDeliveryConfidence: 70,
      },
      kanban: {
        hasKanbanData: true,
        periods: [],
        avgThroughputPerPeriod: 5,
        avgCycleTimeDays: 5,
        avgLeadTimeDays: 10,
        avgFlowEfficiencyPct: 60,
        totalAgingWip: 0,
        overallFlowHealth: 'Healthy',
      },
      midSprint: [],
    },
    dataQuality: dataQuality(),
    fieldImpacts: { hasIssues: false, critical: [], high: [], medium: [], low: [], all: [], topSummary: '' },
    confidence: confidenceMap(),
  };

  return { ...base, ...overrides };
}

function emptyMetrics(): DashboardMetrics {
  return buildMetrics({
    totalIssues: 0,
    flow: { issues: 0, done: 0, good: 0, warning: 0, critical: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, leadTimeSampleSize: 0, cycleTimeSampleSize: 0, items: [] },
    capacity: [],
    epics: [],
    relations: undefined as unknown as DashboardMetrics['relations'],
    confidence: confidenceMap({
      leadTime: { sampleSize: 0, confidence: 0 },
      cycleTime: { sampleSize: 0, confidence: 0 },
      sprintThroughput: { sampleSize: 0, confidence: 0 },
      velocity: { sampleSize: 0, confidence: 0 },
      storyPoints: { sampleSize: 0, confidence: 0 },
      kanbanFlow: { sampleSize: 0, confidence: 0 },
      healthScore: { sampleSize: 0, confidence: 0 },
      orphanRisk: { sampleSize: 0, confidence: 0 },
      midSprint: { sampleSize: 0, confidence: 0 },
      teamCapacity: { sampleSize: 0, confidence: 0 },
      releaseReadiness: { sampleSize: 0, confidence: 0 },
    }),
  });
}

// ── TEST-RBC-01: suggestions generated per role (all 7 categories) ────────────

describe('TEST-RBC-01: one insight per category generator', () => {
  const metrics = buildMetrics();
  const ceremonyAdvice = buildCeremonyAdvice(metrics);

  test('TC-RBC-01a: scrum master', () => {
    expect(generateScrumMasterInsight(metrics, ceremonyAdvice).category).toBe('scrum_master');
  });
  test('TC-RBC-01b: product owner', () => {
    expect(generateProductOwnerInsight(metrics, ceremonyAdvice).category).toBe('product_owner');
  });
  test('TC-RBC-01c: engineering manager', () => {
    expect(generateEngineeringManagerInsight(metrics, ceremonyAdvice).category).toBe('engineering_manager');
  });
  test('TC-RBC-01d: delivery manager', () => {
    expect(generateDeliveryManagerInsight(metrics, ceremonyAdvice).category).toBe('delivery_manager');
  });
  test('TC-RBC-01e: team lead', () => {
    expect(generateTeamLeadInsight(metrics, ceremonyAdvice).category).toBe('team_lead');
  });
  test('TC-RBC-01f: c-level', () => {
    expect(generateCLevelInsight(metrics, ceremonyAdvice).category).toBe('c_level');
  });
  test('TC-RBC-01g: admin', () => {
    expect(generateAdminInsight(metrics, ceremonyAdvice).category).toBe('admin');
  });

  test('TC-RBC-01h: role -> category visibility mapping', () => {
    expect(visibleCategoriesForRole('scrum_master')).toEqual(['scrum_master']);
    expect(visibleCategoriesForRole('product_owner')).toEqual(['product_owner']);
    expect(visibleCategoriesForRole('manager')).toEqual(['engineering_manager', 'delivery_manager', 'team_lead']);
    expect(visibleCategoriesForRole('c_level')).toEqual(['c_level']);
    expect(visibleCategoriesForRole('admin')).toHaveLength(7);
    expect(visibleCategoriesForRole('user')).toEqual(['team_lead']);
    expect(visibleCategoriesForRole(null)).toEqual(['team_lead']);
  });
});

// ── TEST-RBC-02: suggestions differ by role ────────────────────────────────────

test('TEST-RBC-02 / TC-RBC-02: focusAreas differ between categories for the same metrics', () => {
  const metrics = buildMetrics();
  const bundle = generateAllCoachingInsights(metrics, 'admin');
  const sm = bundle.categories.find((c) => c.category === 'scrum_master')!;
  const po = bundle.categories.find((c) => c.category === 'product_owner')!;
  expect(sm.focusAreas).not.toEqual(po.focusAreas);
  expect(sm.recommendedActions).not.toEqual(po.recommendedActions);
});

// ── TEST-RBC-03: evidence cites real numbers ───────────────────────────────────

test('TEST-RBC-03 / TC-RBC-03: every category evidence cites a real numeric value', () => {
  const metrics = buildMetrics({
    relations: { hasLinks: true, totalLinks: 1, blockedItems: [{ key: 'T-2', summary: 'x', status: 'In Progress', blockedBy: 'T-9', blockCount: 1 }] },
  });
  const bundle = generateAllCoachingInsights(metrics, 'admin');
  for (const insight of bundle.categories) {
    for (const evidence of insight.evidence) {
      expect(evidence.detail).toMatch(/\d/);
    }
  }
});

// ── TEST-RBC-04: known weak signal surfaces in weakPoints ──────────────────────

test('TEST-RBC-04 / TC-RBC-04: 5 blocked items surface as a Scrum Master weak point', () => {
  const blockedItems = Array.from({ length: 5 }, (_, i) => ({
    key: `B-${i}`, summary: 'x', status: 'In Progress', blockedBy: 'X-1', blockCount: 1,
  }));
  const metrics = buildMetrics({ relations: { hasLinks: true, totalLinks: 5, blockedItems } });
  const insight = generateScrumMasterInsight(metrics, buildCeremonyAdvice(metrics));
  expect(insight.weakPoints.some((w) => w.includes('5'))).toBe(true);
});

// ── TEST-RBC-05: ceremony advice populated + identical across categories ──────

test('TEST-RBC-05 / TC-RBC-05: ceremonyAdvice is populated and identical across categories', () => {
  const metrics = buildMetrics({
    relations: { hasLinks: true, totalLinks: 1, blockedItems: [{ key: 'T-2', summary: 'x', status: 'In Progress', blockedBy: 'T-9', blockCount: 1 }] },
  });
  const bundle = generateAllCoachingInsights(metrics, 'admin');
  const sm = bundle.categories.find((c) => c.category === 'scrum_master')!;
  const po = bundle.categories.find((c) => c.category === 'product_owner')!;
  expect(sm.ceremonyAdvice.dailyStandup.length).toBeGreaterThan(0);
  expect(sm.ceremonyAdvice).toEqual(po.ceremonyAdvice);
});

// ── TEST-RBC-06: clear root cause -> non-empty preventionAdvice ────────────────

test('TEST-RBC-06 / TC-RBC-06: carryover produces non-empty preventionAdvice for Product Owner', () => {
  const metrics = buildMetrics({
    throughput: {
      ...buildMetrics().throughput,
      sprint: { ...buildMetrics().throughput.sprint, sprints: [
        { sprintName: 'S1', team: 'A', sprintStart: null, sprintEnd: null, sprintMidpoint: null,
          committedCount: 10, committedPoints: 30, completedCount: 5, completedPoints: 15,
          completionPct: 50, pointCompletionPct: 50, throughputByCount: 5, throughputByPoints: 15,
          midSprintDoneCount: 2, midSprintDonePoints: 6, midSprintPct: 20,
          carryoverCount: 4, addedScopeCount: 0, removedScopeCount: 0,
          blockedCount: 0, bugsCompleted: 0, bugsOpen: 0,
          goalOutcome: 'Missed', deliveryPattern: 'Late Delivery Risk', patternInterpretation: '', deliveryConfidence: 40 },
      ] },
    },
  });
  const insight = generateProductOwnerInsight(metrics, buildCeremonyAdvice(metrics));
  expect(insight.preventionAdvice.length).toBeGreaterThan(0);
});

// ── TEST-RBC-07: nextSprintSuggestions non-empty and actionable ────────────────

test('TEST-RBC-07 / TC-RBC-07: nextSprintSuggestions are non-empty and content-bearing', () => {
  const metrics = buildMetrics();
  const bundle = generateAllCoachingInsights(metrics, 'admin');
  for (const insight of bundle.categories) {
    expect(insight.nextSprintSuggestions.length).toBeGreaterThan(0);
    insight.nextSprintSuggestions.forEach((s) => expect(s.length).toBeGreaterThan(10));
  }
});

// ── TEST-RBC-08: data-quality downgrade lowers confidence ──────────────────────

test('TEST-RBC-08 / TC-RBC-08: Critical data quality strictly lowers confidence vs Excellent', () => {
  const excellent = buildMetrics({ dataQuality: dataQuality('Excellent', 95) });
  const critical = buildMetrics({ dataQuality: dataQuality('Critical', 30) });
  const excellentInsight = generateScrumMasterInsight(excellent, buildCeremonyAdvice(excellent));
  const criticalInsight = generateScrumMasterInsight(critical, buildCeremonyAdvice(critical));
  expect(criticalInsight.confidence.score).toBeLessThan(excellentInsight.confidence.score);
});

// ── TEST-RBC-09: no data -> N/A confidence, safe fallback, no fabricated number ─

test('TEST-RBC-09 / TC-RBC-09: zero sample size produces N/A confidence with safe fallback', () => {
  const metrics = emptyMetrics();
  const insight = generateScrumMasterInsight(metrics, buildCeremonyAdvice(metrics));
  expect(insight.confidence.band).toBe('N/A');
  expect(insight.confidence.score).toBe(0);
  expect(insight.confidence.reason).not.toMatch(/%/);
});

// ── Additional edge cases (CLAUDE.md §45.1) ────────────────────────────────────

describe('Edge cases', () => {
  test('zero issues does not throw for any category', () => {
    const metrics = emptyMetrics();
    expect(() => generateAllCoachingInsights(metrics, 'admin')).not.toThrow();
  });

  test('empty sprint.sprints array does not throw', () => {
    const metrics = buildMetrics();
    metrics.throughput.sprint.sprints = [];
    expect(() => generateProductOwnerInsight(metrics, buildCeremonyAdvice(metrics))).not.toThrow();
  });

  test('confidence threshold boundaries: 80/60/40', () => {
    const at80 = buildMetrics({ confidence: confidenceMap({ kanbanFlow: { confidence: 80, sampleSize: 10 }, cycleTime: { confidence: 80, sampleSize: 10 }, midSprint: { confidence: 80, sampleSize: 10 } }) });
    const insight80 = generateScrumMasterInsight(at80, buildCeremonyAdvice(at80));
    expect(insight80.confidence.band).toBe('High');

    const at60 = buildMetrics({ confidence: confidenceMap({ kanbanFlow: { confidence: 60, sampleSize: 10 }, cycleTime: { confidence: 60, sampleSize: 10 }, midSprint: { confidence: 60, sampleSize: 10 } }) });
    const insight60 = generateScrumMasterInsight(at60, buildCeremonyAdvice(at60));
    expect(insight60.confidence.band).toBe('Medium');

    const at40 = buildMetrics({ confidence: confidenceMap({ kanbanFlow: { confidence: 40, sampleSize: 10 }, cycleTime: { confidence: 40, sampleSize: 10 }, midSprint: { confidence: 40, sampleSize: 10 } }) });
    const insight40 = generateScrumMasterInsight(at40, buildCeremonyAdvice(at40));
    expect(insight40.confidence.band).toBe('Low');
  });

  test('relations undefined/absent does not crash (defensive ?? [])', () => {
    const metrics = buildMetrics({ relations: undefined as unknown as DashboardMetrics['relations'] });
    expect(() => generateScrumMasterInsight(metrics, buildCeremonyAdvice(metrics))).not.toThrow();
  });
});
