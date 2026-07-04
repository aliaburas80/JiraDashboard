// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Engineering Manager insights (RBC-05) — delivery predictability, throughput
// trend, capacity imbalance, bottlenecks, dependencies, release readiness.

import type { DashboardMetrics } from '@/types/metrics';
import type { CeremonyAdvice, CoachingEvidence, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import { getRelations } from '../coachingMetricsAccess';
import { aggregateCategoryConfidence } from '../coachingConfidence.service';
import { deriveSeverity } from '@/lib/coachingBadge';

export function generateEngineeringManagerInsight(
  metrics: DashboardMetrics,
  ceremonyAdvice: CeremonyAdvice,
): RoleBasedCoachingInsight {
  const trendDirection = metrics.throughput.sprint.trendDirection;
  const avgThroughputCount = metrics.throughput.sprint.averageThroughputCount;
  const overloaded = metrics.capacity.filter((c) => c.loadShare > 35);
  const blockedItems = getRelations(metrics).blockedItems;
  const overdueIssues = metrics.risk.overdueIssues;

  const evidence: CoachingEvidence[] = [];
  const weakPoints: string[] = [];
  const focusAreas: string[] = [];
  const recommendedActions: string[] = [];
  const preventionAdvice: string[] = [];

  if (trendDirection === 'Declining') {
    evidence.push({
      metricKey: 'throughput.sprint.trendDirection',
      label: 'Throughput Trend',
      value: trendDirection,
      detail: `Sprint delivery trend is Declining (average throughput ${avgThroughputCount.toFixed(1)} items/sprint).`,
    });
    weakPoints.push('Throughput trend is Declining across recorded sprints.');
    recommendedActions.push('Investigate whether the decline is capacity, scope, or process related before next planning.');
  }

  if (overloaded.length > 0 && metrics.capacity.length > 2) {
    evidence.push({
      metricKey: 'capacity[].loadShare',
      label: 'Capacity Imbalance',
      value: `${overloaded.length} overloaded`,
      detail: `${overloaded.length} team member(s) (e.g. ${overloaded[0].assignee}) carry over 35% of total team load.`,
    });
    weakPoints.push(`${overloaded.length} team member(s) are overloaded relative to the team.`);
    focusAreas.push('Rebalance work distribution across the team.');
  }

  if (blockedItems.length > 0) {
    evidence.push({
      metricKey: 'relations.blockedItems',
      label: 'Blocked Items',
      value: String(blockedItems.length),
      detail: `${blockedItems.length} item(s) are blocked, which can mask true capacity constraints.`,
    });
    weakPoints.push(`${blockedItems.length} item(s) are blocked.`);
  }

  if (overdueIssues > 0) {
    evidence.push({
      metricKey: 'risk.overdueIssues',
      label: 'Overdue Issues',
      value: String(overdueIssues),
      detail: `${overdueIssues} item(s) are past their due date and still open.`,
    });
    weakPoints.push(`${overdueIssues} item(s) are overdue.`);
    recommendedActions.push('Review overdue items in the next planning session and re-baseline or escalate them.');
  }

  if (metrics.healthScore < 60) {
    weakPoints.push(`Overall health score is ${metrics.healthScore}, below the healthy threshold.`);
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Delivery predictability signals look healthy — maintain current team structure.');
  }
  if (focusAreas.length === 0) {
    focusAreas.push('Maintain current capacity distribution.');
  }

  const confidence = aggregateCategoryConfidence(metrics, ['sprintThroughput', 'velocity', 'releaseReadiness', 'teamCapacity']);
  const severity = deriveSeverity(weakPoints.length, confidence.score, overdueIssues > 0 && overloaded.length > 0);

  return {
    category: 'engineering_manager',
    healthSummary: weakPoints.length > 0
      ? `${weakPoints.length} delivery-predictability risk(s) detected — see weak points and evidence below.`
      : 'Delivery predictability and team capacity look stable based on the currently uploaded data.',
    weakPoints,
    focusAreas,
    recommendedActions,
    preventionAdvice,
    ceremonyAdvice,
    nextSprintSuggestions: [
      overloaded.length > 0 ? 'Rebalance assignments before next sprint planning.' : 'Keep current assignment distribution.',
      overdueIssues > 0 ? 'Re-baseline or escalate overdue items before next sprint planning.' : 'Continue current delivery cadence.',
    ],
    evidence,
    severity,
    confidence,
  };
}
