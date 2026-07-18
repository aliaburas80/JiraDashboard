// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Team Role View grid — TC-RGV-01 to TC-RGV-06.

import type { DashboardMetrics, FlowItem, CapacityEntry } from '@/types/metrics';
import type { SprintThroughput } from '@/types/throughput';
import { buildRoleGridView } from '@/services/coaching/roleGridView.mapper';

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

function sprintThroughput(overrides: Partial<SprintThroughput> = {}): SprintThroughput {
  return {
    sprintName: 'Sprint 1',
    team: 'Team A',
    sprintStart: '2026-01-01',
    sprintEnd: '2026-01-14',
    sprintMidpoint: '2026-01-07',
    committedCount: 10,
    committedPoints: 30,
    completedCount: 10,
    completedPoints: 30,
    completionPct: 100,
    pointCompletionPct: 100,
    throughputByCount: 10,
    throughputByPoints: 30,
    midSprintDoneCount: 5,
    midSprintDonePoints: 15,
    midSprintPct: 50,
    carryoverCount: 0,
    addedScopeCount: 0,
    removedScopeCount: 0,
    blockedCount: 0,
    bugsCompleted: 0,
    bugsOpen: 0,
    goalOutcome: 'Met',
    deliveryPattern: 'Healthy Early Progress',
    patternInterpretation: '',
    deliveryConfidence: 90,
    ...overrides,
  };
}

function buildMetrics(overrides: Partial<DashboardMetrics> = {}): DashboardMetrics {
  const items = overrides.flow?.items ?? [flowItem('T-1')];
  const capacity: CapacityEntry[] = overrides.capacity ?? [
    { assignee: 'Ali', issues: 5, activeIssues: 2, doneIssues: 3, storyPoints: 20, doneStoryPoints: 12, loadShare: 20 },
  ];
  const sprints = overrides.throughput?.sprint?.sprints ?? [];

  const base: DashboardMetrics = {
    totalIssues: items.length,
    doneIssues: 0,
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
      good: items.length,
      warning: 0,
      critical: 0,
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
    epics: [],
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
        sprints,
        totalSprints: sprints.length,
        totalCommitted: sprints.reduce((s, sp) => s + sp.committedCount, 0),
        totalCompleted: sprints.reduce((s, sp) => s + sp.completedCount, 0),
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
    dataQuality: { score: 95, band: 'Excellent', totalIssues: items.length, checks: [], summary: '', affectedMetrics: [], criticalCount: 0, highCount: 0 },
    fieldImpacts: { hasIssues: false, critical: [], high: [], medium: [], low: [], all: [], topSummary: '' },
    confidence: {} as DashboardMetrics['confidence'], // unused by roleGridView.mapper.ts — fixture-only
  };

  return { ...base, ...overrides };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('buildRoleGridView', () => {
  it('returns exactly 3 roles in order: Scrum Master, Product Owner, Manager', () => {
    const roles = buildRoleGridView(buildMetrics());
    expect(roles.map((r) => r.id)).toEqual(['scrum_master', 'product_owner', 'manager']);
  });

  it('flags all rules healthy on clean data (no blockers, no overdue, no orphans, no overload)', () => {
    const roles = buildRoleGridView(buildMetrics());
    for (const role of roles) {
      for (const rule of role.rules) {
        // Retro-ownership and priority-visibility rules are always 'healthy' (no
        // tracking data exists), every other rule should also read healthy here.
        expect(rule.status).toBe('healthy');
      }
    }
  });

  it('flags Scrum Master "blocked work" rule critical when blocked items exist', () => {
    const metrics = buildMetrics({ relations: { hasLinks: true, totalLinks: 1, blockedItems: [{ key: 'A-1', summary: 'x', status: 'To Do', blockedBy: 'A-2', blockCount: 1 }] } });
    const [scrumMaster] = buildRoleGridView(metrics);
    const rule = scrumMaster.rules.find((r) => r.title.startsWith('Blocked work'))!;
    expect(rule.status).toBe('critical');
    expect(scrumMaster.metrics.find((m) => m.label === 'Blocked items')!.value).toBe(1);
  });

  it('computes carryover rate as a percentage of total committed and flags risk above 20%', () => {
    const sprints = [sprintThroughput({ committedCount: 10, carryoverCount: 3 })]; // 30% > 20% threshold
    const metrics = buildMetrics({
      throughput: {
        ...buildMetrics().throughput,
        sprint: {
          ...buildMetrics().throughput.sprint,
          sprints,
          totalCommitted: sprints.reduce((s, sp) => s + sp.committedCount, 0),
        },
      },
    });
    const [scrumMaster] = buildRoleGridView(metrics);
    const rule = scrumMaster.rules.find((r) => r.title.startsWith('Carry-over'))!;
    expect(rule.status).toBe('risk');
    expect(scrumMaster.metrics.find((m) => m.label === 'Carry-over')!.value).toBe('30%');
  });

  it('handles zero sprints without NaN or a crash (Product Owner sprint goal coverage)', () => {
    const roles = buildRoleGridView(buildMetrics());
    const [, productOwner] = roles;
    expect(productOwner.metrics.find((m) => m.label === 'Sprint goal coverage')!.value).toBe('—');
  });

  it('flags Manager "delivery forecasts" rule critical below 60% confidence and computes forecast variance', () => {
    const metrics = buildMetrics({ overallDeliveryConfidence: 45 });
    const [, , manager] = buildRoleGridView(metrics);
    const rule = manager.rules.find((r) => r.title.startsWith('Delivery forecasts'))!;
    expect(rule.status).toBe('critical');
    expect(manager.metrics.find((m) => m.label === 'Forecast variance')!.value).toBe('55%');
  });

  it('flags Manager capacity rule at risk when a member exceeds 35% load share in a team larger than 2', () => {
    const metrics = buildMetrics({
      capacity: [
        { assignee: 'Ali', issues: 5, activeIssues: 2, doneIssues: 3, storyPoints: 20, doneStoryPoints: 12, loadShare: 60 },
        { assignee: 'Sam', issues: 3, activeIssues: 1, doneIssues: 2, storyPoints: 10, doneStoryPoints: 6, loadShare: 20 },
        { assignee: 'Lee', issues: 3, activeIssues: 1, doneIssues: 2, storyPoints: 10, doneStoryPoints: 6, loadShare: 20 },
      ],
    });
    const [, , manager] = buildRoleGridView(metrics);
    const rule = manager.rules.find((r) => r.title.startsWith('Capacity overload'))!;
    expect(rule.status).toBe('risk');
    expect(manager.metrics.find((m) => m.label === 'Overloaded members')!.value).toBe(1);
  });

  it('CP3-011: embeds the carry-over, capacity, and delivery-confidence thresholds in each rule\'s own description', () => {
    const [scrumMaster, , manager] = buildRoleGridView(buildMetrics());
    const carryoverRule = scrumMaster.rules.find((r) => r.title.startsWith('Carry-over'))!;
    const capacityRule = manager.rules.find((r) => r.title.startsWith('Capacity overload'))!;
    const forecastRule = manager.rules.find((r) => r.title.startsWith('Delivery forecasts'))!;
    expect(carryoverRule.description).toContain('20%');
    expect(capacityRule.description).toContain('35%');
    expect(forecastRule.description).toContain('60%');
  });

  it('CP3-012: flags "Retro actions completed" as isEstimate, since no ownership/completion tracking exists', () => {
    const [scrumMaster] = buildRoleGridView(buildMetrics());
    const metric = scrumMaster.metrics.find((m) => m.label === 'Retro actions completed')!;
    expect(metric.isEstimate).toBe(true);
    // Every other Scrum Master metric is a real computed value, not a placeholder.
    for (const other of scrumMaster.metrics.filter((m) => m.label !== 'Retro actions completed')) {
      expect(other.isEstimate).toBeUndefined();
    }
  });

  it('does not flag capacity overload for a team of 2 or fewer, even if one member is over 35% load share', () => {
    // Same small-team guard as scrumMaster.generator.ts / engineeringManager.generator.ts —
    // a 1-2 person team trivially has someone over 35% load share, which isn't meaningful.
    const metrics = buildMetrics({
      capacity: [{ assignee: 'Ali', issues: 5, activeIssues: 2, doneIssues: 3, storyPoints: 20, doneStoryPoints: 12, loadShare: 100 }],
    });
    const [, , manager] = buildRoleGridView(metrics);
    const rule = manager.rules.find((r) => r.title.startsWith('Capacity overload'))!;
    expect(rule.status).toBe('healthy');
    const action = manager.actions.find((a) => a.detail.includes('Review ownership'))!;
    expect(action.title).toBe('Confirm team capacity stays balanced');
  });
});
