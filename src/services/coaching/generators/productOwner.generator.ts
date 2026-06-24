// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Product Owner insights (RBC-04) — sprint goal clarity, scope change,
// carryover, orphan ratio, backlog readiness, refinement discipline.

import type { DashboardMetrics } from '@/types/metrics';
import type { CeremonyAdvice, CoachingEvidence, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import { getEpics } from '../coachingMetricsAccess';
import { aggregateCategoryConfidence } from '../coachingConfidence.service';
import { deriveSeverity } from '@/lib/coachingBadge';

export function generateProductOwnerInsight(
  metrics: DashboardMetrics,
  ceremonyAdvice: CeremonyAdvice,
): RoleBasedCoachingInsight {
  const sprints = metrics.throughput.sprint.sprints;
  const latestSprint = sprints[0];
  const addedScope = sprints.reduce((sum, s) => sum + s.addedScopeCount, 0);
  const removedScope = sprints.reduce((sum, s) => sum + s.removedScopeCount, 0);
  const carryover = sprints.reduce((sum, s) => sum + s.carryoverCount, 0);
  const orphanCount = metrics.flow.items.filter((i) => i.isOrphan).length;
  const orphanRatio = metrics.totalIssues > 0 ? Math.round((orphanCount / metrics.totalIssues) * 100) : 0;
  const epics = getEpics(metrics);
  const criticalEpics = epics.filter((e) => e.critical > 0);
  const missingAcChecks = metrics.dataQuality.checks.filter((c) => c.missingPct > 0);

  const evidence: CoachingEvidence[] = [];
  const weakPoints: string[] = [];
  const focusAreas: string[] = [];
  const recommendedActions: string[] = [];
  const preventionAdvice: string[] = [];

  if (latestSprint && latestSprint.goalOutcome !== 'Met') {
    evidence.push({
      metricKey: 'throughput.sprint.sprints[0].goalOutcome',
      label: 'Latest Sprint Goal Outcome',
      value: latestSprint.goalOutcome,
      detail: `Latest sprint ("${latestSprint.sprintName}") goal outcome was "${latestSprint.goalOutcome}".`,
    });
    weakPoints.push(`Sprint goal was not fully met (${latestSprint.goalOutcome}).`);
    recommendedActions.push('Clarify the sprint goal statement so the team can self-assess "met" vs "missed" mid-sprint.');
  }

  if (addedScope + removedScope > 0) {
    evidence.push({
      metricKey: 'throughput.sprint.sprints[].addedScopeCount/removedScopeCount',
      label: 'Scope Change',
      value: `+${addedScope} / -${removedScope}`,
      detail: `${addedScope} item(s) added and ${removedScope} removed mid-sprint across recorded sprints.`,
    });
    weakPoints.push(`Scope changed mid-sprint (+${addedScope}/-${removedScope}).`);
    focusAreas.push('Reduce mid-sprint scope changes by refining the backlog further ahead of commitment.');
  }

  if (carryover > 0) {
    evidence.push({
      metricKey: 'throughput.sprint.sprints[].carryoverCount',
      label: 'Carryover',
      value: String(carryover),
      detail: `${carryover} item(s) carried over from sprint to sprint.`,
    });
    weakPoints.push(`${carryover} item(s) carried over between sprints.`);
    preventionAdvice.push('Split large backlog items before they enter a sprint to reduce carryover.');
  }

  if (orphanCount > 0) {
    evidence.push({
      metricKey: 'flow.items[].isOrphan',
      label: 'Orphan Ratio',
      value: `${orphanRatio}%`,
      detail: `${orphanCount} item(s) (${orphanRatio}% of total) have no parent/epic link.`,
    });
    weakPoints.push(`${orphanRatio}% of items have no parent/epic link (orphaned).`);
    recommendedActions.push('Require an Epic Link or Parent Key before items leave refinement.');
  }

  if (criticalEpics.length > 0) {
    evidence.push({
      metricKey: 'epics[].critical',
      label: 'Critical Epics',
      value: String(criticalEpics.length),
      detail: `${criticalEpics.length} epic(s) (e.g. "${criticalEpics[0].epic}") have critical-health child items.`,
    });
    weakPoints.push(`${criticalEpics.length} epic(s) contain critical-health items.`);
    focusAreas.push('Prioritize backlog readiness review for epics with critical-health children.');
  }

  if (missingAcChecks.length > 0) {
    weakPoints.push(`${missingAcChecks.length} data-quality check(s) related to backlog readiness are failing.`);
    preventionAdvice.push('Add a Definition of Ready checklist covering the currently-failing fields.');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Backlog readiness signals look healthy — keep current refinement cadence.');
  }
  if (focusAreas.length === 0) {
    focusAreas.push('Maintain current backlog readiness discipline.');
  }

  const confidence = aggregateCategoryConfidence(metrics, ['sprintThroughput', 'orphanRisk']);
  const severity = deriveSeverity(weakPoints.length, confidence.score, criticalEpics.length > 0);

  return {
    category: 'product_owner',
    healthSummary: weakPoints.length > 0
      ? `${weakPoints.length} backlog/delivery risk(s) detected — see weak points and evidence below.`
      : 'Backlog readiness and sprint outcomes look stable based on the currently uploaded data.',
    weakPoints,
    focusAreas,
    recommendedActions,
    preventionAdvice,
    ceremonyAdvice,
    nextSprintSuggestions: [
      carryover > 0 ? 'Plan carried-over items first next sprint, before new backlog items.' : 'Continue planning fresh backlog items in priority order.',
      orphanCount > 0 ? 'Block new items from entering a sprint without a parent/epic link.' : 'Continue requiring parent/epic links for new items.',
    ],
    evidence,
    severity,
    confidence,
  };
}
