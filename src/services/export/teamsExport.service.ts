// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Team Health Comparison (/teams) CSV export — MPE-01.
// Mirrors the columns already shown in the page's Detail Table.

import { buildSafeCsv } from '@/lib/exportSafety';
import type { TeamHealthEntry } from '@/lib/teamHealth';

const HEADER = [
  'Member', 'Health Score', 'Band', 'Total Issues', 'Done Issues', 'Completion %',
  'Active Issues', 'Blocked', 'Critical', 'Warning', 'Good',
  'Story Points Done', 'Story Points Total', 'Load %', 'Avg Open Age (days)',
];

function entryToRow(t: TeamHealthEntry): unknown[] {
  return [
    t.assignee,
    t.healthScore,
    t.band,
    t.totalIssues,
    t.doneIssues,
    t.completionPct,
    t.activeIssues,
    t.blockedCount,
    t.criticalCount,
    t.warningCount,
    t.goodCount,
    t.doneStoryPoints,
    t.storyPoints,
    t.loadShare,
    t.avgOpenAgeDays ?? '',
  ];
}

export function buildTeamsCsv(teams: TeamHealthEntry[]): string {
  return buildSafeCsv([HEADER, ...teams.map(entryToRow)], { alwaysQuote: true });
}

export function exportTeamsToCsv(teams: TeamHealthEntry[]): void {
  const csv = buildTeamsCsv(teams);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `team-health-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
