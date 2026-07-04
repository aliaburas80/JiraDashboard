// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Mid-sprint delivery analysis.
// Derives per-sprint mid-point delivery insights from SprintThroughputSummary.
// Kept separate so it can be consumed independently by the dashboard and export.

import type { MidSprintInsight, SprintThroughputSummary } from '@/types/throughput';

export function calculateMidSprintInsights(
  summary: SprintThroughputSummary,
): MidSprintInsight[] {
  return summary.sprints.map(sprint => ({
    sprintName:          sprint.sprintName,
    team:                sprint.team,
    sprintMidpoint:      sprint.sprintMidpoint,
    midDoneCount:        sprint.midSprintDoneCount,
    midDonePoints:       sprint.midSprintDonePoints,
    midSprintPct:        sprint.midSprintPct,
    finalCompletionPct:  sprint.completionPct,
    pattern:             sprint.deliveryPattern,
    interpretation:      sprint.patternInterpretation,
    isEndLoaded:         sprint.deliveryPattern === 'End-Loaded Sprint',
    isScopeUnstable:     sprint.deliveryPattern === 'Scope Instability',
    isBlocked:           sprint.deliveryPattern === 'Blocked Sprint',
  }));
}
