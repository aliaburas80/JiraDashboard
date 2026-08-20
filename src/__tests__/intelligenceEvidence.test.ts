import { buildEvidenceAnswer, buildIntelligenceSnapshot, INTELLIGENCE_AGENTS } from '@/lib/intelligence/evidence';
import type { DashboardMetrics } from '@/types/metrics';

function metricsFixture(): DashboardMetrics {
  return {
    totalIssues: 20,
    doneIssues: 12,
    activeIssues: 8,
    blockedIssues: 2,
    openDefects: 3,
    completionRate: 60,
    customerVisibleProgress: 58,
    overallDeliveryConfidence: 54,
    totalCustomerVisible: 10,
    healthScore: 57,
    flow: {
      issues: 20,
      done: 12,
      good: 10,
      warning: 6,
      critical: 4,
      averageLeadTimeDays: 12.4,
      averageCycleTimeDays: 7.6,
      leadTimeSampleSize: 10,
      cycleTimeSampleSize: 10,
      items: [
        {
          key: 'DC-24',
          summary: 'Blocked checkout integration',
          type: 'Story',
          status: 'In Progress',
          highLevelStatus: 'In Progress',
          sprint: 'Sprint 4',
          epic: 'Checkout',
          isOrphan: false,
          assignee: 'Amina',
          priority: 'Highest',
          storyPoints: 8,
          createdDate: '01/Aug/2026',
          startedDate: '03/Aug/2026',
          doneDate: '',
          leadTimeDays: null,
          cycleTimeDays: null,
          ageDays: 18,
          activeAgeDays: 16,
          labels: '',
          parent: '',
          project: 'DC',
          health: 'critical',
          reason: 'Blocked by external API',
          fixVersion: 'v2',
          blocked: true,
        },
      ],
    },
    sprint: { hasSprintData: true, sprintCount: 1, sprints: [] },
    kanban: { byStatus: [], byHighLevelStatus: [] },
    quarters: [],
    capacity: [
      { assignee: 'Amina', issues: 10, activeIssues: 6, doneIssues: 4, storyPoints: 30, doneStoryPoints: 10, loadShare: 48 },
      { assignee: 'Omar', issues: 6, activeIssues: 2, doneIssues: 4, storyPoints: 20, doneStoryPoints: 14, loadShare: 29 },
    ],
    epics: [
      { epic: 'Checkout', issues: 8, progress: 50, critical: 2, warning: 1 },
      { epic: 'Profiles', issues: 6, progress: 80, critical: 0, warning: 1 },
    ],
    labels: {},
    types: [],
    projects: [],
    parents: [],
    relations: {},
    risk: { blockedIssues: 2, overdueIssues: 3, highPriorityOpenIssues: 4, openDefects: 3 },
    storyPoints: { totalStoryPoints: 50, completedStoryPoints: 28, remainingStoryPoints: 22, pointCompletionRate: 56 },
    prediction: { complete: false, daysRemaining: 23, predictedDate: '2026-09-13', velocityPerDay: 0.35 },
    insights: ['Two blockers are constraining flow.'],
    throughput: {} as DashboardMetrics['throughput'],
    dataQuality: { score: 86 } as DashboardMetrics['dataQuality'],
    fieldImpacts: {} as DashboardMetrics['fieldImpacts'],
    confidence: {} as DashboardMetrics['confidence'],
  };
}

describe('Delivery Intelligence evidence', () => {
  it('builds a compact decision snapshot from dashboard metrics', () => {
    const snapshot = buildIntelligenceSnapshot(metricsFixture());

    expect(snapshot.totalIssues).toBe(20);
    expect(snapshot.deliveryConfidence).toBe(54);
    expect(snapshot.riskItems[0]).toMatchObject({ key: 'DC-24', blocked: true, severity: 'critical' });
    expect(snapshot.capacityHotspots[0]).toMatchObject({ assignee: 'Amina', loadShare: 48 });
    expect(snapshot.epicSignals[0].name).toBe('Checkout');
  });

  it('provides grounded specialist answers without an AI provider', () => {
    const snapshot = buildIntelligenceSnapshot(metricsFixture());
    const risk = buildEvidenceAnswer('risk', snapshot, 'What should I act on?');
    const forecast = buildEvidenceAnswer('forecast', snapshot);

    expect(risk.mode).toBe('evidence');
    expect(risk.findings.some(item => item.title === 'DC-24')).toBe(true);
    expect(risk.actions.length).toBeGreaterThan(0);
    expect(forecast.summary).toContain('2026-09-13');
  });

  it('exposes four distinct specialist agents', () => {
    expect(INTELLIGENCE_AGENTS.map(agent => agent.id)).toEqual(['executive', 'flow', 'risk', 'forecast']);
  });
});
