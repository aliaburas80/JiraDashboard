// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// C-level / Executive insights (RBC-07) — delivery health, business risk,
// forecast confidence, escalation needs, decision support.

import type { DashboardMetrics } from '@/types/metrics';
import type { CeremonyAdvice, CoachingEvidence, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import { aggregateCategoryConfidence } from '../coachingConfidence.service';
import { deriveSeverity } from '@/lib/coachingBadge';

export function generateCLevelInsight(
  metrics: DashboardMetrics,
  ceremonyAdvice: CeremonyAdvice,
): RoleBasedCoachingInsight {
  const healthScore = metrics.healthScore;
  const deliveryConfidence = metrics.overallDeliveryConfidence;
  const completionRate = metrics.completionRate;
  const overdueIssues = metrics.risk.overdueIssues;
  const highPriorityOpen = metrics.risk.highPriorityOpenIssues;

  const evidence: CoachingEvidence[] = [];
  const weakPoints: string[] = [];
  const focusAreas: string[] = [];
  const recommendedActions: string[] = [];
  const preventionAdvice: string[] = [];

  evidence.push({
    metricKey: 'healthScore',
    label: 'Delivery Health Score',
    value: String(healthScore),
    detail: `Overall delivery health score is ${healthScore}/100.`,
  });
  evidence.push({
    metricKey: 'completionRate',
    label: 'Completion Rate',
    value: `${completionRate}%`,
    detail: `${completionRate}% of tracked work is complete.`,
  });

  if (healthScore < 60) {
    weakPoints.push(`Delivery health score is ${healthScore}, below a healthy threshold.`);
    recommendedActions.push('Request a focused readout from delivery leadership on the top 1-2 root causes.');
  }

  if (deliveryConfidence > 0 && deliveryConfidence < 60) {
    evidence.push({
      metricKey: 'overallDeliveryConfidence',
      label: 'Overall Delivery Confidence',
      value: `${deliveryConfidence}%`,
      detail: `Overall delivery confidence is ${deliveryConfidence}%.`,
    });
    weakPoints.push(`Overall delivery confidence is low (${deliveryConfidence}%).`);
  }

  if (overdueIssues > 0) {
    evidence.push({
      metricKey: 'risk.overdueIssues',
      label: 'Overdue Issues',
      value: String(overdueIssues),
      detail: `${overdueIssues} item(s) are overdue — a business-risk signal.`,
    });
    weakPoints.push(`${overdueIssues} item(s) are overdue.`);
  }

  if (highPriorityOpen > 0) {
    evidence.push({
      metricKey: 'risk.highPriorityOpenIssues',
      label: 'High-priority Open Issues',
      value: String(highPriorityOpen),
      detail: `${highPriorityOpen} high-priority item(s) remain open.`,
    });
    weakPoints.push(`${highPriorityOpen} high-priority item(s) are still open.`);
    focusAreas.push('Confirm high-priority open items have an executive-visible owner and date.');
  }

  if (weakPoints.length >= 2) {
    preventionAdvice.push('Escalate the combined health/confidence/overdue signal now rather than waiting for the next scheduled review.');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Delivery health signals look healthy — no immediate escalation needed.');
  }
  if (focusAreas.length === 0) {
    focusAreas.push('Maintain current delivery oversight cadence.');
  }

  const confidence = aggregateCategoryConfidence(metrics, ['healthScore', 'releaseReadiness']);
  const severity = deriveSeverity(weakPoints.length, confidence.score, healthScore < 40);

  return {
    category: 'c_level',
    healthSummary: weakPoints.length > 0
      ? `${weakPoints.length} business-risk signal(s) detected — see weak points and evidence below.`
      : 'Delivery health looks stable based on the currently uploaded data.',
    weakPoints,
    focusAreas,
    recommendedActions,
    preventionAdvice,
    ceremonyAdvice,
    nextSprintSuggestions: [
      healthScore < 60 ? 'Request a delivery-health readout ahead of next sprint review.' : 'Continue current reporting cadence.',
    ],
    evidence,
    severity,
    confidence,
  };
}
