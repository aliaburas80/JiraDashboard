// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Ceremony advice rules (RBC-10–14) — team-wide cadence recommendations computed
// once from DashboardMetrics and embedded identically into every visible coaching
// category. Each rule returns a sentence only when it actually fires, citing real
// numbers — never a generic/placeholder line ("no generic Agile advice").

import type { DashboardMetrics } from '@/types/metrics';
import type { CeremonyAdvice } from '@/types/roleBasedCoaching';
import { getRelations } from './coachingMetricsAccess';

function compact(lines: (string | null)[]): string[] {
  return lines.filter((line): line is string => line !== null);
}

function dailyStandupAdvice(metrics: DashboardMetrics): string[] {
  const blocked = getRelations(metrics).blockedItems.length;
  const agingWip = metrics.throughput.kanban.totalAgingWip;
  const midSprint = metrics.throughput.midSprint;
  const lowMidSprint = midSprint.some((m) => m.midSprintPct < 40);
  const decliningCycle = metrics.throughput.sprint.trendDirection === 'Declining';
  const lowConfidenceMetrics = Object.values(metrics.confidence).filter(
    (m) => m.band === 'Low' || m.band === 'Unreliable',
  );

  return compact([
    blocked > 0
      ? `Hold a daily standup focused on unblocking — ${blocked} item${blocked > 1 ? 's are' : ' is'} explicitly blocked.`
      : null,
    agingWip > 0
      ? `Review aging work-in-progress daily — ${agingWip} item${agingWip > 1 ? 's have' : ' has'} been active longer than the aging-WIP threshold.`
      : null,
    lowMidSprint
      ? `At least one sprint is below 40% mid-sprint completion — use daily standups to surface why progress is end-loaded.`
      : null,
    lowConfidenceMetrics.length > 0
      ? `${lowConfidenceMetrics.length} metric${lowConfidenceMetrics.length > 1 ? 's have' : ' has'} Low/Unreliable confidence — flag data-entry gaps during standup.`
      : null,
    decliningCycle
      ? `Cycle time trend is Declining — discuss what is slowing work down in today's standup.`
      : null,
  ]);
}

function refinementAdvice(metrics: DashboardMetrics): string[] {
  const orphanCount = metrics.flow.items.filter((i) => i.isOrphan).length;
  const sprints = metrics.throughput.sprint.sprints;
  const addedScope = sprints.reduce((sum, s) => sum + s.addedScopeCount, 0);
  const removedScope = sprints.reduce((sum, s) => sum + s.removedScopeCount, 0);
  const carryover = sprints.reduce((sum, s) => sum + s.carryoverCount, 0);
  const totalStoryPoints = metrics.storyPoints.totalStoryPoints;
  const dataQualityWeak = metrics.dataQuality.band === 'Weak' || metrics.dataQuality.band === 'Critical';

  return compact([
    orphanCount > 0
      ? `${orphanCount} item${orphanCount > 1 ? 's have' : ' has'} no parent/epic link — use refinement to attach orphaned work to a parent.`
      : null,
    addedScope + removedScope > 0
      ? `${addedScope} item${addedScope !== 1 ? 's were' : ' was'} added and ${removedScope} removed mid-sprint across recorded sprints — tighten refinement to reduce scope churn.`
      : null,
    carryover > 0
      ? `${carryover} item${carryover > 1 ? 's have' : ' has'} carried over across sprints — refine large/ambiguous items before they re-enter a sprint.`
      : null,
    totalStoryPoints === 0
      ? `No Story Points are recorded — use refinement to estimate backlog items before commitment.`
      : null,
    dataQualityWeak
      ? `Data Quality is ${metrics.dataQuality.band} (${metrics.dataQuality.score}) — refinement should confirm acceptance criteria and required fields are captured.`
      : null,
  ]);
}

function sprintPlanningAdvice(metrics: DashboardMetrics): string[] {
  const blocked = getRelations(metrics).blockedItems.length;
  const avgThroughputCount = metrics.throughput.sprint.averageThroughputCount;
  const carryover = metrics.throughput.sprint.sprints.reduce((sum, s) => sum + s.carryoverCount, 0);
  const acChecks = metrics.dataQuality.checks.filter((c) => c.affectsMetrics.length > 0 && c.missingPct > 0);

  return compact([
    avgThroughputCount > 0
      ? `Use the team's average throughput of ${avgThroughputCount.toFixed(1)} items/sprint as the planning baseline — avoid overcommitting above it.`
      : null,
    carryover > 0
      ? `${carryover} carried-over item${carryover > 1 ? 's' : ''} should be planned first, before new backlog items.`
      : null,
    blocked > 0
      ? `${blocked} item${blocked > 1 ? 's are' : ' is'} currently blocked — confirm dependencies are resolved or excluded before committing them to the next sprint.`
      : null,
    acChecks.length > 0
      ? `${acChecks.length} data-quality check${acChecks.length > 1 ? 's are' : ' is'} failing (${acChecks.map((c) => c.label).join(', ')}) — confirm estimates/acceptance criteria during planning.`
      : null,
  ]);
}

function sprintReviewAdvice(metrics: DashboardMetrics): string[] {
  const sprints = metrics.throughput.sprint.sprints;
  const latest = sprints[0];
  const lowConfidence = metrics.overallDeliveryConfidence > 0 && metrics.overallDeliveryConfidence < 60;

  return compact([
    latest && latest.goalOutcome !== 'Met'
      ? `Latest sprint ("${latest.sprintName}") goal outcome was "${latest.goalOutcome}" — use sprint review to explain the gap to stakeholders with real numbers.`
      : null,
    lowConfidence
      ? `Overall delivery confidence is ${metrics.overallDeliveryConfidence}% — sprint review should explicitly call out delivered value versus committed value.`
      : null,
  ]);
}

function retrospectiveAdvice(metrics: DashboardMetrics): string[] {
  const decliningCycle = metrics.throughput.sprint.trendDirection === 'Declining';
  const sprintsWithCarryover = metrics.throughput.sprint.sprints.filter((s) => s.carryoverCount > 0).length;
  const dataQualityWeak = metrics.dataQuality.band === 'Weak' || metrics.dataQuality.band === 'Critical';
  const lowConfidenceMetrics = Object.values(metrics.confidence).filter(
    (m) => m.band === 'Low' || m.band === 'Unreliable',
  );

  return compact([
    decliningCycle
      ? `Cycle time trend is Declining — make "what is slowing delivery down" a retrospective topic.`
      : null,
    sprintsWithCarryover >= 2
      ? `${sprintsWithCarryover} of the last sprints had carryover — discuss whether items are being over-committed or under-refined.`
      : null,
    dataQualityWeak
      ? `Data Quality has been ${metrics.dataQuality.band} — raise data-entry discipline (required fields) as a retrospective action item.`
      : null,
    lowConfidenceMetrics.length > 0
      ? `${lowConfidenceMetrics.length} metric${lowConfidenceMetrics.length > 1 ? 's' : ''} (${lowConfidenceMetrics.map((m) => m.metricLabel).join(', ')}) have Low/Unreliable confidence — discuss closing those data gaps.`
      : null,
  ]);
}

export function buildCeremonyAdvice(metrics: DashboardMetrics): CeremonyAdvice {
  return {
    dailyStandup: dailyStandupAdvice(metrics),
    refinement: refinementAdvice(metrics),
    sprintPlanning: sprintPlanningAdvice(metrics),
    sprintReview: sprintReviewAdvice(metrics),
    retrospective: retrospectiveAdvice(metrics),
  };
}
