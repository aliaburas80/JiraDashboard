// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Rule-based recommendation engine.
// Every recommendation carries: priority, area, text, evidence, impact,
// suggested owner, and suggested action — fully traceable, no black-box output.

import type { DashboardMetrics } from '@/types/metrics';

export type RecommendationPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type RecommendationArea =
  | 'Delivery' | 'Quality' | 'Process' | 'Data' | 'Team' | 'Flow';

export interface Recommendation {
  priority: RecommendationPriority;
  area: RecommendationArea;
  text: string;
  evidence: string;
  impact: string;
  suggestedOwner: string;
  suggestedAction: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function generateRecommendations(metrics: DashboardMetrics): Recommendation[] {
  const recs: Recommendation[] = [];
  const flow      = (metrics.flow      ?? {}) as any;
  const sp        = (metrics.storyPoints ?? {}) as any;
  const risk      = (metrics.risk       ?? {}) as any;
  const sprint    = metrics.throughput?.sprint;
  const kanban    = metrics.throughput?.kanban;
  const items     = (flow.items ?? []) as any[];
  const total     = Math.max(items.length, 1);

  // ── CRITICAL: Blocked items ───────────────────────────────────────────────
  if (metrics.blockedIssues >= 3) {
    recs.push({
      priority: 'Critical',
      area: 'Delivery',
      text: `Escalate ${metrics.blockedIssues} blocked items immediately — they are stalling delivery.`,
      evidence: `${metrics.blockedIssues} items have Blocked Flag = true across the export.`,
      impact: 'Blocked items directly reduce throughput and increase carryover risk.',
      suggestedOwner: 'Scrum Master / Delivery Manager',
      suggestedAction: 'Run a blocker-clearing session; assign each blocker an owner and SLA.',
    });
  } else if (metrics.blockedIssues > 0) {
    recs.push({
      priority: 'High',
      area: 'Delivery',
      text: `${metrics.blockedIssues} blocked item${metrics.blockedIssues > 1 ? 's' : ''} need resolution before sprint end.`,
      evidence: `${metrics.blockedIssues} items have Blocked Flag = true.`,
      impact: 'Unresolved blockers typically carryover to the next sprint.',
      suggestedOwner: 'Scrum Master',
      suggestedAction: 'Add each blocked item to the next daily standup agenda.',
    });
  }

  // ── CRITICAL: Flow health ─────────────────────────────────────────────────
  const criticalRatio = pct(flow.critical ?? 0, total);
  if (criticalRatio >= 20) {
    recs.push({
      priority: 'Critical',
      area: 'Flow',
      text: `${criticalRatio}% of items are in critical flow health — delivery is at serious risk.`,
      evidence: `${flow.critical} critical items out of ${total} total.`,
      impact: 'High critical ratio indicates systemic delivery problems, not isolated issues.',
      suggestedOwner: 'Engineering Manager',
      suggestedAction: 'Hold an emergency triage session. Prioritise critical items over new work.',
    });
  } else if (criticalRatio >= 10) {
    recs.push({
      priority: 'High',
      area: 'Flow',
      text: `${flow.critical} critical items detected. Review and unblock before adding new scope.`,
      evidence: `${criticalRatio}% of all items are critical health.`,
      impact: 'Critical items left unaddressed create compounding delivery debt.',
      suggestedOwner: 'Scrum Master',
      suggestedAction: 'Add critical items to the next sprint review. Do not start new work until resolved.',
    });
  }

  // ── HIGH: Lead time ───────────────────────────────────────────────────────
  const avgLead = flow.averageLeadTimeDays ?? 0;
  if (avgLead > 21) {
    recs.push({
      priority: 'High',
      area: 'Flow',
      text: `Average lead time is ${avgLead} days — items are taking over 3 weeks from creation to done.`,
      evidence: `${flow.leadTimeSampleSize} completed items averaged ${avgLead} days lead time.`,
      impact: 'Long lead times indicate backlog age, over-commitment, or process inefficiency.',
      suggestedOwner: 'Engineering Manager / Scrum Master',
      suggestedAction: 'Review backlog age. Implement WIP limits. Break large items into smaller deliverables.',
    });
  } else if (avgLead > 14) {
    recs.push({
      priority: 'Medium',
      area: 'Process',
      text: `Lead time is ${avgLead} days. Target under 14 days for healthy flow.`,
      evidence: `${flow.leadTimeSampleSize} items sampled.`,
      impact: 'Lead time above 14 days signals items are waiting in queue longer than expected.',
      suggestedOwner: 'Scrum Master',
      suggestedAction: 'Identify which stage adds the most wait time and apply a WIP limit there.',
    });
  }

  // ── HIGH: Cycle time ─────────────────────────────────────────────────────
  const avgCycle = flow.averageCycleTimeDays ?? 0;
  if (avgCycle > 14) {
    recs.push({
      priority: 'High',
      area: 'Process',
      text: `Average cycle time is ${avgCycle} days. Active work takes too long to complete.`,
      evidence: `${flow.cycleTimeSampleSize} items averaged ${avgCycle} days from start to done.`,
      impact: 'Long cycle times reduce throughput and make delivery prediction unreliable.',
      suggestedOwner: 'Engineering Manager',
      suggestedAction: 'Reduce story sizes to under 3 days of effort. Pair on complex items.',
    });
  }

  // ── HIGH: Orphan items ────────────────────────────────────────────────────
  const orphanCount = items.filter((i: any) => i.isOrphan).length;
  const orphanRatio = pct(orphanCount, total);
  if (orphanRatio >= 15) {
    recs.push({
      priority: 'High',
      area: 'Data',
      text: `${orphanCount} orphan items (${orphanRatio}%) have no Epic or Parent link — reporting accuracy is compromised.`,
      evidence: `${orphanCount} items missing both Epic Link and Parent Key.`,
      impact: 'Orphan items are invisible in roadmap and epic-level reporting. Delivery tracking is unreliable.',
      suggestedOwner: 'Product Owner',
      suggestedAction: 'Re-export Jira with Epic Link and Parent Key columns. Link all orphan items to their Epic.',
    });
  } else if (orphanCount > 0) {
    recs.push({
      priority: 'Medium',
      area: 'Data',
      text: `${orphanCount} orphan items have no parent link. Link them to restore delivery structure.`,
      evidence: `${orphanCount} items missing Epic Link and Parent Key.`,
      impact: 'Orphan items skew epic-level completion and delivery confidence metrics.',
      suggestedOwner: 'Product Owner',
      suggestedAction: 'Assign each orphan item to its parent Epic in Jira, then re-export.',
    });
  }

  // ── HIGH: Bug ratio ───────────────────────────────────────────────────────
  const openDefects  = metrics.openDefects ?? 0;
  const defectRatio  = pct(openDefects, total);
  if (defectRatio >= 15) {
    recs.push({
      priority: 'High',
      area: 'Quality',
      text: `Bug ratio is ${defectRatio}% (${openDefects} open defects). Consider a dedicated bug sprint.`,
      evidence: `${openDefects} open bugs out of ${total} items.`,
      impact: 'High bug ratio signals quality debt that will slow future delivery.',
      suggestedOwner: 'QA Lead / Engineering Manager',
      suggestedAction: 'Schedule a bug sprint. Stop accepting new feature scope until bug ratio drops below 10%.',
    });
  } else if (defectRatio >= 8) {
    recs.push({
      priority: 'Medium',
      area: 'Quality',
      text: `${openDefects} open bugs (${defectRatio}%). Monitor quality before it becomes a sprint blocker.`,
      evidence: `${openDefects} open defects in the current dataset.`,
      impact: 'Unresolved bugs accumulate and increase regression risk.',
      suggestedOwner: 'Scrum Master',
      suggestedAction: 'Allocate 20% of each sprint to bug resolution until ratio drops below 5%.',
    });
  }

  // ── MEDIUM: Sprint completion ─────────────────────────────────────────────
  if (sprint && sprint.totalSprints >= 2) {
    if (sprint.averageCompletionPct < 60) {
      recs.push({
        priority: 'High',
        area: 'Process',
        text: `Average sprint completion is only ${sprint.averageCompletionPct}% across ${sprint.totalSprints} sprints.`,
        evidence: `Average computed from ${sprint.totalSprints} sprints: ${sprint.averageThroughputCount} issues/sprint completed on average.`,
        impact: 'Low sprint completion indicates over-commitment or sprint planning problems.',
        suggestedOwner: 'Scrum Master',
        suggestedAction: 'Reduce sprint commitment by 20%. Focus on completing started work before pulling new items.',
      });
    } else if (sprint.averageCompletionPct < 80) {
      recs.push({
        priority: 'Medium',
        area: 'Process',
        text: `Sprint completion averages ${sprint.averageCompletionPct}% — room to improve predictability.`,
        evidence: `${sprint.totalSprints} sprints analysed. Target is 80%+.`,
        impact: 'Completion below 80% erodes stakeholder confidence in sprint commitments.',
        suggestedOwner: 'Scrum Master',
        suggestedAction: 'Review sprint planning estimation techniques. Consider planning poker for all stories.',
      });
    }

    // End-loaded sprints
    if (sprint.endLoadedSprintCount >= 2) {
      recs.push({
        priority: 'Medium',
        area: 'Process',
        text: `${sprint.endLoadedSprintCount} sprints show end-loaded delivery — most work completes in the final days.`,
        evidence: `${sprint.endLoadedSprintCount} sprints with mid-sprint delivery below 20%.`,
        impact: 'End-loaded sprints leave no buffer for late discoveries or blockers.',
        suggestedOwner: 'Scrum Master',
        suggestedAction: 'Break stories into tasks of 1–2 days. Run daily progress checks against sprint goal.',
      });
    }
  }

  // ── MEDIUM: Kanban flow efficiency ───────────────────────────────────────
  if (kanban?.hasKanbanData && kanban.avgFlowEfficiencyPct < 40 && kanban.avgLeadTimeDays > 0) {
    recs.push({
      priority: 'Medium',
      area: 'Flow',
      text: `Kanban flow efficiency is ${kanban.avgFlowEfficiencyPct}% — items spend most time waiting, not being worked.`,
      evidence: `Avg cycle time ${kanban.avgCycleTimeDays}d vs avg lead time ${kanban.avgLeadTimeDays}d.`,
      impact: 'Low flow efficiency means large queues and slow delivery even when the team is busy.',
      suggestedOwner: 'Engineering Manager',
      suggestedAction: 'Implement WIP limits. Make queue wait times visible in daily standups.',
    });
  }

  // ── MEDIUM: Story points missing ─────────────────────────────────────────
  if ((sp.totalStoryPoints ?? 0) === 0) {
    recs.push({
      priority: 'Low',
      area: 'Data',
      text: 'Story points are missing. Capacity and velocity analytics are issue-count only.',
      evidence: 'Story Points column is absent or all values are zero/empty.',
      impact: 'Without story points, effort-based planning and velocity trending are unavailable.',
      suggestedOwner: 'Product Owner / Scrum Master',
      suggestedAction: 'Estimate all backlog items in story points. Re-export Jira with Story Points column.',
    });
  }

  // ── LOW: Missing assignees ────────────────────────────────────────────────
  const unassignedCount = items.filter((i: any) => !i.assignee || i.assignee === 'Unassigned').length;
  const unassignedRatio = pct(unassignedCount, total);
  if (unassignedRatio >= 20) {
    recs.push({
      priority: 'Low',
      area: 'Team',
      text: `${unassignedCount} items (${unassignedRatio}%) have no assignee — capacity reporting is incomplete.`,
      evidence: `${unassignedCount} issues with blank or "Unassigned" assignee field.`,
      impact: 'Unassigned items make team workload analysis and accountability tracking unreliable.',
      suggestedOwner: 'Scrum Master',
      suggestedAction: 'Assign all active and backlog items to team members in Jira.',
    });
  }

  // Sort: Critical first, then High, Medium, Low
  const order: Record<RecommendationPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

// ── Executive narrative ───────────────────────────────────────────────────────

export function generateExecutiveNarrative(metrics: DashboardMetrics, recs: Recommendation[]): string {
  const flow   = (metrics.flow ?? {}) as any;
  const sprint = metrics.throughput?.sprint;
  const band   = metrics.healthScore >= 90 ? 'excellent' : metrics.healthScore >= 75 ? 'good'
               : metrics.healthScore >= 60 ? 'moderate' : metrics.healthScore >= 40 ? 'at-risk' : 'critical';

  const parts: string[] = [];

  parts.push(
    `This delivery dataset contains ${metrics.totalIssues} issues with an overall health score of ` +
    `${metrics.healthScore}/100 (${band}). Completion stands at ${metrics.completionRate}%, ` +
    `with ${metrics.doneIssues} issues done and ${metrics.activeIssues} actively in progress.`
  );

  if (metrics.blockedIssues > 0) {
    parts.push(
      `${metrics.blockedIssues} item${metrics.blockedIssues > 1 ? 's are' : ' is'} currently blocked, ` +
      `representing an immediate risk to the sprint goal.`
    );
  }

  if (flow.averageLeadTimeDays > 0) {
    parts.push(
      `Average lead time is ${flow.averageLeadTimeDays} days and average cycle time is ` +
      `${flow.averageCycleTimeDays} days, giving a flow efficiency of approximately ` +
      `${flow.averageCycleTimeDays > 0 && flow.averageLeadTimeDays > 0
          ? Math.round((flow.averageCycleTimeDays / flow.averageLeadTimeDays) * 100)
          : 0}%.`
    );
  }

  if (sprint && sprint.totalSprints >= 1) {
    parts.push(
      `Across ${sprint.totalSprints} sprint${sprint.totalSprints > 1 ? 's' : ''}, the team averages ` +
      `${sprint.averageThroughputCount} issues per sprint at ${sprint.averageCompletionPct}% completion. ` +
      `Delivery trend is ${sprint.trendDirection.toLowerCase()}.`
    );
  }

  const criticalRec = recs.find(r => r.priority === 'Critical');
  if (criticalRec) {
    parts.push(`Top priority action: ${criticalRec.text}`);
  } else if (recs.length > 0) {
    parts.push(`Top recommendation: ${recs[0].text}`);
  }

  return parts.join(' ');
}
