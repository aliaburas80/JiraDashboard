// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Delivery Manager insights (RBC-06) — release confidence, timeline risk,
// cross-team blockers, forecast vs target, dependencies.
//
// Note: `calculateReleaseReadiness()` groups by the raw `Fix Version/s` field,
// which only exists on the originally-uploaded issue records, not on the
// normalized `FlowItem` shape inside `DashboardMetrics.flow.items` (no Fix
// Version is captured there). Calling it with `flow.items` always returns
// `hasVersionData: false`, so this generator relies on `prediction`,
// `overallDeliveryConfidence`, and `risk` instead — signals that are reliably
// populated on `DashboardMetrics`.

import type { DashboardMetrics } from '@/types/metrics';
import type { CeremonyAdvice, CoachingEvidence, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import { getRelations } from '../coachingMetricsAccess';
import { aggregateCategoryConfidence } from '../coachingConfidence.service';
import { deriveSeverity } from '@/lib/coachingBadge';

export function generateDeliveryManagerInsight(
  metrics: DashboardMetrics,
  ceremonyAdvice: CeremonyAdvice,
): RoleBasedCoachingInsight {
  const prediction = metrics.prediction;
  const blockedItems = getRelations(metrics).blockedItems;
  const overdueIssues = metrics.risk.overdueIssues;
  const deliveryConfidence = metrics.overallDeliveryConfidence;
  const trendDirection = metrics.throughput.sprint.trendDirection;

  const evidence: CoachingEvidence[] = [];
  const weakPoints: string[] = [];
  const focusAreas: string[] = [];
  const recommendedActions: string[] = [];
  const preventionAdvice: string[] = [];

  if (!prediction.complete && prediction.daysRemaining !== null) {
    evidence.push({
      metricKey: 'prediction.daysRemaining',
      label: 'Forecasted Completion',
      value: `${prediction.daysRemaining} days`,
      detail: `At the current velocity, remaining work is forecast to complete in ${prediction.daysRemaining} days (${prediction.predictedDate ?? 'date TBD'}).`,
    });
  }

  if (overdueIssues > 0) {
    evidence.push({
      metricKey: 'risk.overdueIssues',
      label: 'Overdue Issues',
      value: String(overdueIssues),
      detail: `${overdueIssues} item(s) are past their due date and still open — a timeline risk.`,
    });
    weakPoints.push(`${overdueIssues} item(s) are overdue, putting the timeline at risk.`);
    recommendedActions.push('Escalate overdue items and confirm whether the target date needs renegotiation.');
  }

  if (blockedItems.length > 0) {
    evidence.push({
      metricKey: 'relations.blockedItems',
      label: 'Cross-team Blockers',
      value: String(blockedItems.length),
      detail: `${blockedItems.length} item(s) are blocked, e.g. ${blockedItems[0].key} blocked by ${blockedItems[0].blockedBy}.`,
    });
    weakPoints.push(`${blockedItems.length} item(s) are blocked, possibly by cross-team dependencies.`);
    focusAreas.push('Map blocked items to the teams/dependencies responsible and track resolution dates.');
  }

  if (deliveryConfidence > 0 && deliveryConfidence < 60) {
    evidence.push({
      metricKey: 'overallDeliveryConfidence',
      label: 'Overall Delivery Confidence',
      value: `${deliveryConfidence}%`,
      detail: `Overall delivery confidence is ${deliveryConfidence}%, below a healthy threshold.`,
    });
    weakPoints.push(`Overall delivery confidence is low (${deliveryConfidence}%).`);
    preventionAdvice.push('Communicate the confidence gap to stakeholders before the next review, not at the deadline.');
  }

  if (trendDirection === 'Declining') {
    weakPoints.push('Sprint throughput trend is Declining, which increases timeline risk.');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Timeline and dependency signals look healthy — maintain current delivery cadence.');
  }
  if (focusAreas.length === 0) {
    focusAreas.push('Maintain current cross-team dependency tracking.');
  }

  const confidence = aggregateCategoryConfidence(metrics, ['releaseReadiness', 'velocity']);
  const severity = deriveSeverity(weakPoints.length, confidence.score, overdueIssues > 0 && blockedItems.length > 0);

  return {
    category: 'delivery_manager',
    healthSummary: weakPoints.length > 0
      ? `${weakPoints.length} timeline/dependency risk(s) detected — see weak points and evidence below.`
      : 'Timeline and dependency signals look stable based on the currently uploaded data.',
    weakPoints,
    focusAreas,
    recommendedActions,
    preventionAdvice,
    ceremonyAdvice,
    nextSprintSuggestions: [
      overdueIssues > 0 ? 'Re-confirm the target date with stakeholders before next sprint planning.' : 'Continue current timeline communication cadence.',
      blockedItems.length > 0 ? 'Track cross-team blocker resolution dates explicitly next sprint.' : 'Continue current dependency tracking.',
    ],
    evidence,
    severity,
    confidence,
  };
}
