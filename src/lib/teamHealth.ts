// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Team-level health aggregation.
// Derives a comparable health score per assignee from capacity + flow items.
//
// Health score (0-100):
//   50 pts — completion rate  (doneIssues / totalIssues)
//   30 pts — no critical items (1 - criticalCount / totalIssues)
//   20 pts — no blocked items  (1 - blockedCount  / totalIssues)

import type { CapacityEntry, FlowItem } from '@/types/metrics';

export type TeamHealthBand = 'Healthy' | 'At Risk' | 'Critical';

export interface TeamHealthEntry {
  assignee:       string;
  totalIssues:    number;
  doneIssues:     number;
  activeIssues:   number;
  blockedCount:   number;
  criticalCount:  number;
  warningCount:   number;
  goodCount:      number;
  storyPoints:    number;
  doneStoryPoints: number;
  loadShare:      number;
  completionPct:  number;
  healthScore:    number;
  band:           TeamHealthBand;
  avgOpenAgeDays: number | null;
}

const DONE_ST   = new Set(['done', 'closed', 'resolved']);
const norm      = (v: unknown) => String(v ?? '').trim().toLowerCase();
const isBlocked = (r: string)  => norm(r).includes('block');

export function computeTeamHealth(
  capacity: CapacityEntry[],
  flowItems: FlowItem[],
): TeamHealthEntry[] {
  // Index flow items by assignee
  const byAssignee = new Map<string, FlowItem[]>();
  for (const item of flowItems) {
    const key = item.assignee?.trim() || '(unassigned)';
    if (!byAssignee.has(key)) byAssignee.set(key, []);
    byAssignee.get(key)!.push(item);
  }

  return capacity.map(cap => {
    const name  = cap.assignee?.trim() || '(unassigned)';
    const items = byAssignee.get(name) ?? [];

    const blockedCount  = items.filter(i => !DONE_ST.has(norm(i.status)) && isBlocked(i.reason)).length;
    const criticalCount = items.filter(i => !DONE_ST.has(norm(i.status)) && i.health === 'critical').length;
    const warningCount  = items.filter(i => !DONE_ST.has(norm(i.status)) && i.health === 'warning').length;
    const goodCount     = items.filter(i => !DONE_ST.has(norm(i.status)) && i.health === 'good').length;

    const openItems  = items.filter(i => !DONE_ST.has(norm(i.status)));
    const openAges   = openItems.map(i => i.ageDays).filter((d): d is number => d !== null);
    const avgOpenAgeDays = openAges.length
      ? Math.round(openAges.reduce((s, d) => s + d, 0) / openAges.length)
      : null;

    const total        = Math.max(cap.issues, 1);
    const completionPct = Math.round((cap.doneIssues / total) * 100);

    const healthScore = Math.round(Math.max(0, Math.min(100,
      (cap.doneIssues  / total) * 50 +
      (1 - Math.min(criticalCount / total, 1)) * 30 +
      (1 - Math.min(blockedCount  / total, 1)) * 20,
    )));

    const band: TeamHealthBand =
      healthScore >= 70 ? 'Healthy' :
      healthScore >= 40 ? 'At Risk' :
      'Critical';

    return {
      assignee:        name,
      totalIssues:     cap.issues,
      doneIssues:      cap.doneIssues,
      activeIssues:    cap.activeIssues,
      blockedCount,
      criticalCount,
      warningCount,
      goodCount,
      storyPoints:     cap.storyPoints,
      doneStoryPoints: cap.doneStoryPoints,
      loadShare:       Math.round(cap.loadShare),
      completionPct,
      healthScore,
      band,
      avgOpenAgeDays,
    };
  }).sort((a, b) => b.healthScore - a.healthScore);
}

export function teamBandColor(band: TeamHealthBand): string {
  return band === 'Healthy' ? '#16a34a' : band === 'At Risk' ? '#f59e0b' : '#dc2626';
}

export function teamBandBg(band: TeamHealthBand): string {
  return band === 'Healthy' ? '#f0fdf4' : band === 'At Risk' ? '#fffbeb' : '#fef2f2';
}
