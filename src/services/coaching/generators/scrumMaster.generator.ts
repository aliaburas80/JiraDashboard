// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Scrum Master / Agile Coach insights (RBC-03) — blocked items, aging WIP,
// flow efficiency, cycle time, daily discipline, impediment removal, WIP limits.

import type { DashboardMetrics } from '@/types/metrics';
import type { CeremonyAdvice, CoachingEvidence, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import { getRelations } from '../coachingMetricsAccess';
import { aggregateCategoryConfidence } from '../coachingConfidence.service';
import { deriveSeverity } from '@/lib/coachingBadge';

export function generateScrumMasterInsight(
  metrics: DashboardMetrics,
  ceremonyAdvice: CeremonyAdvice,
): RoleBasedCoachingInsight {
  const blockedItems = getRelations(metrics).blockedItems;
  const agingWip = metrics.throughput.kanban.totalAgingWip;
  const flowEfficiency = metrics.throughput.kanban.avgFlowEfficiencyPct;
  const cycleTime = metrics.flow.averageCycleTimeDays;
  const severeBottleneckPeriods = metrics.throughput.kanban.periods.filter((p) => p.bottleneckStatus === 'Severe');
  const overloaded = metrics.capacity.filter((c) => c.loadShare > 35);

  const evidence: CoachingEvidence[] = [];
  const weakPoints: string[] = [];
  const focusAreas: string[] = [];
  const recommendedActions: string[] = [];
  const preventionAdvice: string[] = [];

  if (blockedItems.length > 0) {
    evidence.push({
      metricKey: 'relations.blockedItems',
      label: 'Blocked Items',
      value: String(blockedItems.length),
      detail: `${blockedItems.length} item(s) are explicitly blocked, e.g. ${blockedItems[0].key} blocked by ${blockedItems[0].blockedBy}.`,
    });
    weakPoints.push(`${blockedItems.length} item(s) are blocked and need impediment removal.`);
    recommendedActions.push('Run a dedicated blocker-removal pass — assign an owner to each blocked item.');
    preventionAdvice.push('Surface blockers the day they appear, not at sprint review, to avoid them aging.');
  }

  if (agingWip > 0) {
    evidence.push({
      metricKey: 'throughput.kanban.totalAgingWip',
      label: 'Aging WIP',
      value: String(agingWip),
      detail: `${agingWip} item(s) have been active for longer than the aging-WIP threshold (14 days).`,
    });
    weakPoints.push(`${agingWip} item(s) are aging work-in-progress.`);
    focusAreas.push('Reduce work-in-progress age by enforcing WIP limits per status.');
  }

  if (flowEfficiency > 0 && flowEfficiency < 40) {
    evidence.push({
      metricKey: 'throughput.kanban.avgFlowEfficiencyPct',
      label: 'Flow Efficiency',
      value: `${flowEfficiency}%`,
      detail: `Average flow efficiency is ${flowEfficiency}% — most lead time is spent waiting, not in active work.`,
    });
    weakPoints.push(`Flow efficiency is low (${flowEfficiency}%) — work spends most of its time waiting.`);
    focusAreas.push('Investigate hand-off delays between statuses (e.g. waiting for review/QA).');
  }

  if (cycleTime > 0) {
    evidence.push({
      metricKey: 'flow.averageCycleTimeDays',
      label: 'Average Cycle Time',
      value: `${cycleTime} days`,
      detail: `Average cycle time across completed items is ${cycleTime} days.`,
    });
  }

  if (severeBottleneckPeriods.length > 0) {
    weakPoints.push(`${severeBottleneckPeriods.length} reporting period(s) show a Severe Kanban bottleneck.`);
    recommendedActions.push('Identify the specific status causing the Severe bottleneck and swarm it.');
  }

  if (overloaded.length > 0 && metrics.capacity.length > 2) {
    weakPoints.push(`${overloaded.length} team member(s) carry over 35% of the team's load.`);
    recommendedActions.push('Rebalance assignments to reduce load concentration on a small number of people.');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Flow signals look healthy — keep current WIP limits and daily cadence.');
  }
  if (focusAreas.length === 0) {
    focusAreas.push('Maintain current flow discipline; no major flow risk detected.');
  }

  const confidence = aggregateCategoryConfidence(metrics, ['kanbanFlow', 'cycleTime', 'midSprint']);
  const severity = deriveSeverity(weakPoints.length, confidence.score, blockedItems.length > 0 && agingWip > 0);

  return {
    category: 'scrum_master',
    healthSummary: weakPoints.length > 0
      ? `${weakPoints.length} flow risk(s) detected — see weak points and evidence below.`
      : 'Flow health looks stable based on the currently uploaded data.',
    weakPoints,
    focusAreas,
    recommendedActions,
    preventionAdvice,
    ceremonyAdvice,
    nextSprintSuggestions: [
      agingWip > 0 ? `Set a WIP limit to prevent more than ${Math.max(1, Math.round(agingWip / 2))} items aging past 14 days next sprint.` : 'Keep current WIP limits next sprint.',
      blockedItems.length > 0 ? 'Add a blocker-aging check to the daily standup next sprint.' : 'Continue current daily standup format next sprint.',
    ],
    evidence,
    severity,
    confidence,
  };
}
