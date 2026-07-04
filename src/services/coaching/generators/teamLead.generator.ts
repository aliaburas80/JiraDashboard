// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Team Lead insights (RBC-08) — technical blockers, review/QA bottlenecks,
// work splitting, ownership gaps.
//
// This app has no first-class "code review" or "QA" pipeline-stage concept —
// review/QA bottleneck evidence is best-effort, via substring matching against
// FlowItem.status/highLevelStatus. When no match exists, the evidence line is
// simply omitted (never fabricated) — consistent with "no generic advice".

import type { DashboardMetrics } from '@/types/metrics';
import type { CeremonyAdvice, CoachingEvidence, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import { aggregateCategoryConfidence } from '../coachingConfidence.service';
import { deriveSeverity } from '@/lib/coachingBadge';

const REVIEW_QA_PATTERN = /review|qa|testing|uat/i;

export function generateTeamLeadInsight(
  metrics: DashboardMetrics,
  ceremonyAdvice: CeremonyAdvice,
): RoleBasedCoachingInsight {
  const criticalItems = metrics.flow.items.filter((i) => i.health === 'critical');
  const blockerItems = criticalItems.filter((i) => i.reason.toLowerCase().includes('block'));
  const reviewQaItems = metrics.flow.items.filter(
    (i) => !['done', 'closed', 'resolved'].includes(i.status.toLowerCase())
      && (REVIEW_QA_PATTERN.test(i.status) || REVIEW_QA_PATTERN.test(i.highLevelStatus)),
  );
  const unassigned = metrics.capacity.find((c) => c.assignee === 'Unassigned');

  const evidence: CoachingEvidence[] = [];
  const weakPoints: string[] = [];
  const focusAreas: string[] = [];
  const recommendedActions: string[] = [];
  const preventionAdvice: string[] = [];

  if (blockerItems.length > 0) {
    evidence.push({
      metricKey: 'flow.items[].reason',
      label: 'Technical Blockers',
      value: String(blockerItems.length),
      detail: `${blockerItems.length} item(s) are critical-health and blocked, e.g. "${blockerItems[0].key}: ${blockerItems[0].reason}"`,
    });
    weakPoints.push(`${blockerItems.length} item(s) are technically blocked.`);
    recommendedActions.push('Pair on the blocked item(s) directly rather than waiting for the next standup.');
  }

  if (reviewQaItems.length > 0) {
    evidence.push({
      metricKey: 'flow.items[].status',
      label: 'Review/QA Stage Items',
      value: String(reviewQaItems.length),
      detail: `${reviewQaItems.length} item(s) are currently sitting in a review/QA-like status (e.g. "${reviewQaItems[0].status}").`,
    });
    weakPoints.push(`${reviewQaItems.length} item(s) are waiting in review/QA.`);
    focusAreas.push('Treat review/QA as a first-class WIP stage — limit how many items can sit there at once.');
  }

  if (unassigned && unassigned.issues > 0) {
    evidence.push({
      metricKey: 'capacity[].assignee=Unassigned',
      label: 'Ownership Gaps',
      value: String(unassigned.issues),
      detail: `${unassigned.issues} item(s) have no assignee.`,
    });
    weakPoints.push(`${unassigned.issues} item(s) have no assignee.`);
    preventionAdvice.push('Assign an owner to every item entering active work, not after it stalls.');
  }

  if (criticalItems.length > blockerItems.length) {
    const other = criticalItems.length - blockerItems.length;
    weakPoints.push(`${other} additional item(s) are critical-health for non-blocker reasons (age/overdue/cycle-time).`);
    recommendedActions.push('Consider splitting large or stuck items into smaller, independently shippable pieces.');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Technical execution signals look healthy — keep current review/QA practices.');
  }
  if (focusAreas.length === 0) {
    focusAreas.push('Maintain current ownership and review practices.');
  }

  const confidence = aggregateCategoryConfidence(metrics, ['kanbanFlow', 'storyPoints']);
  const severity = deriveSeverity(weakPoints.length, confidence.score, blockerItems.length > 0);

  return {
    category: 'team_lead',
    healthSummary: weakPoints.length > 0
      ? `${weakPoints.length} technical-execution risk(s) detected — see weak points and evidence below.`
      : 'Technical execution signals look stable based on the currently uploaded data.',
    weakPoints,
    focusAreas,
    recommendedActions,
    preventionAdvice,
    ceremonyAdvice,
    nextSprintSuggestions: [
      reviewQaItems.length > 0 ? 'Set a WIP limit on the review/QA stage next sprint.' : 'Keep current review/QA flow.',
      unassigned && unassigned.issues > 0 ? 'Require an assignee before an item moves to active work next sprint.' : 'Continue current ownership practices.',
    ],
    evidence,
    severity,
    confidence,
  };
}
