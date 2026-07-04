// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Smart Excel export — statistical project insights, not copied HTML.
// Generates a 17-sheet workbook from DashboardMetrics.
// Every sheet is independently useful without the app open.

import * as XLSX from 'xlsx';
import type { DashboardMetrics } from '@/types/metrics';
import { getHealthBand, HEALTH_COLORS } from '@/lib/utils';
import { generateRecommendations, generateExecutiveNarrative } from './recommendationEngine';

// ── Shared helpers ────────────────────────────────────────────────────────────

function makeWs(rows: unknown[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Auto-filter on header row
  if (rows.length > 0) {
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: rows[0].length - 1 } }) };
  }
  return ws;
}

function colWidths(widths: number[]): XLSX.ColInfo[] {
  return widths.map(w => ({ wch: w }));
}

function freezeRow(ws: XLSX.WorkSheet): void {
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as any;
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Sheet 01: Executive Summary ───────────────────────────────────────────────

function sheetExecutiveSummary(m: DashboardMetrics, recs: ReturnType<typeof generateRecommendations>): XLSX.WorkSheet {
  const band      = getHealthBand(m.healthScore ?? 0);
  const bandLabel = { excellent: 'Excellent', good: 'Good', moderate: 'Moderate', 'at-risk': 'At Risk', critical: 'Critical' };
  const flow      = (m.flow ?? {}) as any;
  const sp        = (m.storyPoints ?? {}) as any;
  const sprint    = m.throughput?.sprint;
  const narrative = generateExecutiveNarrative(m, recs);

  const rows: unknown[][] = [
    ['DELIVERY CLARITY — EXECUTIVE REPORT'],
    ['From messy boards to measurable delivery confidence'],
    ['Generated:', new Date().toLocaleString()],
    ['Author:', 'Ali Abu Ras · ali.aburas@deliveryclarity.app · Delivery Clarity v4.1'],
    [],
    ['DELIVERY HEALTH'],
    ['Health Score', m.healthScore ?? 0, 'out of 100'],
    ['Health Band', bandLabel[band] ?? band],
    ['Completion Rate', `${m.completionRate ?? 0}%`],
    ['Total Issues', m.totalIssues ?? 0],
    ['Done Issues', m.doneIssues ?? 0],
    ['Open Issues', (m.totalIssues ?? 0) - (m.doneIssues ?? 0)],
    ['Active Issues', m.activeIssues ?? 0],
    ['Blocked Issues', m.blockedIssues ?? 0],
    ['Open Defects', m.openDefects ?? 0],
    [],
    ['DELIVERY VELOCITY'],
    ['Avg Lead Time (days)', flow.averageLeadTimeDays ?? 0],
    ['Avg Cycle Time (days)', flow.averageCycleTimeDays ?? 0],
    ['Lead Time Sample Size', flow.leadTimeSampleSize ?? 0],
    ['Cycle Time Sample Size', flow.cycleTimeSampleSize ?? 0],
    ...(sprint && sprint.totalSprints > 0 ? [
      ['Avg Sprint Throughput (issues)', sprint.averageThroughputCount],
      ['Avg Sprint Throughput (points)', sprint.averageThroughputPoints],
      ['Avg Sprint Completion', `${sprint.averageCompletionPct}%`],
      ['Delivery Trend', sprint.trendDirection],
    ] : []),
    [],
    ['STORY POINTS'],
    ['Total Story Points', sp.totalStoryPoints ?? 0],
    ['Completed Story Points', sp.completedStoryPoints ?? 0],
    ['Remaining Story Points', sp.remainingStoryPoints ?? 0],
    ['Story Point Completion', `${sp.pointCompletionRate ?? 0}%`],
    [],
    ['RISK SUMMARY'],
    ['Critical Items', flow.critical ?? 0],
    ['Warning Items', flow.warning ?? 0],
    ['Blocked Items', m.blockedIssues ?? 0],
    ['Overdue Items', m.risk?.overdueIssues ?? 0],
    [],
    ['TOP RECOMMENDATIONS'],
    ['Priority', 'Area', 'Recommendation', 'Suggested Owner'],
    ...recs.slice(0, 5).map(r => [r.priority, r.area, r.text, r.suggestedOwner]),
    [],
    ['EXECUTIVE NARRATIVE'],
    [narrative],
  ];

  const ws = makeWs(rows);
  ws['!cols'] = colWidths([22, 40, 15, 25]);
  return ws;
}

// ── Sheet 02: Project Health ──────────────────────────────────────────────────

function sheetProjectHealth(m: DashboardMetrics): XLSX.WorkSheet {
  const flow  = (m.flow ?? {}) as any;
  const items = (flow.items ?? []) as any[];
  const total = Math.max(items.length, 1);
  const band  = getHealthBand(m.healthScore ?? 0);

  const rows: unknown[][] = [
    ['Metric', 'Value', 'Score (0–100)', 'Interpretation'],
    ['Health Score', m.healthScore ?? 0, m.healthScore ?? 0, m.healthScore >= 90 ? 'Excellent' : m.healthScore >= 75 ? 'Good' : m.healthScore >= 60 ? 'Moderate' : m.healthScore >= 40 ? 'At Risk' : 'Critical'],
    ['Completion Rate', `${m.completionRate ?? 0}%`, m.completionRate ?? 0, m.completionRate >= 90 ? 'On track' : m.completionRate >= 60 ? 'Progressing' : 'Behind'],
    ['Critical Ratio', `${pct(flow.critical ?? 0, total)}%`, Math.max(0, 100 - pct(flow.critical ?? 0, total) * 2), flow.critical > 5 ? 'High risk' : 'Manageable'],
    ['Warning Ratio', `${pct(flow.warning ?? 0, total)}%`, Math.max(0, 100 - pct(flow.warning ?? 0, total)), flow.warning > 10 ? 'Watch closely' : 'Acceptable'],
    ['Blocked Ratio', `${pct(m.blockedIssues ?? 0, total)}%`, Math.max(0, 100 - pct(m.blockedIssues ?? 0, total) * 3), m.blockedIssues > 0 ? 'Action required' : 'Clean'],
    ['Orphan Ratio', `${pct(items.filter((i: any) => i.isOrphan).length, total)}%`, Math.max(0, 100 - pct(items.filter((i: any) => i.isOrphan).length, total) * 2), 'Items without Epic/Parent'],
    ['Avg Lead Time', `${flow.averageLeadTimeDays ?? 0}d`, flow.averageLeadTimeDays <= 7 ? 100 : flow.averageLeadTimeDays <= 14 ? 75 : flow.averageLeadTimeDays <= 21 ? 50 : 25, flow.averageLeadTimeDays > 21 ? 'Needs improvement' : 'Acceptable'],
    ['Avg Cycle Time', `${flow.averageCycleTimeDays ?? 0}d`, flow.averageCycleTimeDays <= 5 ? 100 : flow.averageCycleTimeDays <= 10 ? 75 : flow.averageCycleTimeDays <= 14 ? 50 : 25, flow.averageCycleTimeDays > 14 ? 'Needs improvement' : 'Acceptable'],
    ['Open Defect Ratio', `${pct(m.openDefects ?? 0, total)}%`, Math.max(0, 100 - pct(m.openDefects ?? 0, total) * 4), m.openDefects > 0 ? `${m.openDefects} open bugs` : 'No open bugs'],
  ];

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([28, 18, 18, 30]);
  return ws;
}

// ── Sheet 03: Team Performance ────────────────────────────────────────────────

function sheetTeamPerformance(m: DashboardMetrics): XLSX.WorkSheet {
  const capacity = (m.capacity ?? []) as any[];
  const flow     = (m.flow ?? {}) as any;
  const items    = (flow.items ?? []) as any[];

  const rows: unknown[][] = [
    ['Assignee', 'Total Issues', 'Done', 'Active', 'Blocked', 'Load Share %', 'Story Points', 'SP Done', 'SP Completion %', 'Blocked Count', 'Bug Count'],
  ];

  for (const cap of capacity) {
    const memberItems = items.filter((i: any) => i.assignee === cap.assignee);
    const blockedCount = memberItems.filter((i: any) => i.health === 'critical').length;
    const bugCount = memberItems.filter((i: any) => (i.type ?? '').toLowerCase() === 'bug').length;
    const spCompletion = cap.storyPoints > 0 ? Math.round((cap.doneStoryPoints / cap.storyPoints) * 100) : 0;
    rows.push([
      cap.assignee,
      cap.issues,
      cap.doneIssues,
      cap.activeIssues,
      cap.issues - cap.doneIssues - cap.activeIssues,
      `${cap.loadShare}%`,
      cap.storyPoints,
      cap.doneStoryPoints,
      `${spCompletion}%`,
      blockedCount,
      bugCount,
    ]);
  }

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([22, 14, 8, 10, 10, 14, 14, 10, 16, 14, 12]);
  return ws;
}

// ── Sheet 04: Sprint Throughput ───────────────────────────────────────────────

function sheetSprintThroughput(m: DashboardMetrics): XLSX.WorkSheet {
  const sprint = m.throughput?.sprint;

  const rows: unknown[][] = [
    ['Sprint', 'Team', 'Start', 'End', 'Committed', 'Completed', 'Committed SP', 'Completed SP', 'Completion %', 'Throughput (issues)', 'Throughput (SP)', 'Carryover', 'Added Scope', 'Blocked', 'Bugs Done', 'Bugs Open', 'Goal Outcome'],
  ];

  if (!sprint || !sprint.totalSprints) {
    rows.push(['No sprint data available. Add Sprint, Sprint Start, and Sprint End columns to your Jira export.']);
    const ws = makeWs(rows);
    return ws;
  }

  for (const s of sprint.sprints) {
    rows.push([
      s.sprintName, s.team, s.sprintStart ?? '—', s.sprintEnd ?? '—',
      s.committedCount, s.completedCount, s.committedPoints, s.completedPoints,
      `${s.completionPct}%`, s.throughputByCount, s.throughputByPoints,
      s.carryoverCount, s.addedScopeCount, s.blockedCount,
      s.bugsCompleted, s.bugsOpen, s.goalOutcome,
    ]);
  }

  rows.push([]);
  rows.push(['AVERAGES', '', '', '', sprint.totalCommitted, sprint.totalCompleted, '', '',
    `${sprint.averageCompletionPct}%`, sprint.averageThroughputCount, sprint.averageThroughputPoints]);
  rows.push(['Delivery Trend', sprint.trendDirection, `${sprint.deliveryTrendValue > 0 ? '+' : ''}${sprint.deliveryTrendValue} issues vs prev 3 sprints`]);

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([28, 16, 12, 12, 12, 12, 14, 14, 14, 20, 16, 12, 14, 10, 12, 12, 16]);
  return ws;
}

// ── Sheet 05: Mid-Sprint Delivery ─────────────────────────────────────────────

function sheetMidSprintDelivery(m: DashboardMetrics): XLSX.WorkSheet {
  const midSprint = m.throughput?.midSprint ?? [];

  const rows: unknown[][] = [
    ['Sprint', 'Team', 'Midpoint Date', 'Done by Midpoint', 'SP Done by Midpoint', 'Mid-Sprint %', 'Final Completion %', 'Delivery Pattern', 'Interpretation'],
  ];

  if (!midSprint.length) {
    rows.push(['No mid-sprint data. Sprint date columns (Sprint Start / Sprint End) are required.']);
    return makeWs(rows);
  }

  for (const s of midSprint) {
    rows.push([
      s.sprintName, s.team, s.sprintMidpoint ?? '—',
      s.midDoneCount, s.midDonePoints,
      `${s.midSprintPct}%`, `${s.finalCompletionPct}%`,
      s.pattern, s.interpretation,
    ]);
  }

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([28, 16, 14, 18, 20, 14, 20, 22, 50]);
  return ws;
}

// ── Sheet 06: Kanban Flow ─────────────────────────────────────────────────────

function sheetKanbanFlow(m: DashboardMetrics): XLSX.WorkSheet {
  const kanban = m.throughput?.kanban;

  const rows: unknown[][] = [
    ['Period', 'Team', 'Throughput', 'SP Done', 'Avg Cycle Time (d)', 'Avg Lead Time (d)', 'Flow Efficiency %', 'WIP Average', 'Aging WIP', 'Blocked', 'Reopened', 'Bottleneck', 'Flow Health'],
  ];

  if (!kanban?.hasKanbanData || !kanban.periods.length) {
    rows.push(['No Kanban flow data. Issues without a Sprint field with completed items are analysed here.']);
    return makeWs(rows);
  }

  for (const p of kanban.periods) {
    rows.push([
      p.periodLabel, p.team, p.completedCount, p.completedPoints,
      p.avgCycleTimeDays, p.avgLeadTimeDays,
      p.avgLeadTimeDays > 0 ? `${p.flowEfficiencyPct}%` : '—',
      p.wipAverage, p.agingWipCount, p.blockedCount, p.reopenedCount,
      p.bottleneckStatus, p.flowHealth,
    ]);
  }

  rows.push([]);
  rows.push(['AVERAGES', '', kanban.avgThroughputPerPeriod, '', kanban.avgCycleTimeDays, kanban.avgLeadTimeDays, `${kanban.avgFlowEfficiencyPct}%`, '', kanban.totalAgingWip, '', '', '', kanban.overallFlowHealth]);

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([14, 14, 12, 10, 20, 18, 18, 14, 12, 10, 12, 14, 14]);
  return ws;
}

// ── Sheet 07: Risks and Blockers ──────────────────────────────────────────────

function sheetRisksAndBlockers(m: DashboardMetrics): XLSX.WorkSheet {
  const flow  = (m.flow ?? {}) as any;
  const items = (flow.items ?? []) as any[];

  const riskItems = items.filter((i: any) =>
    i.health === 'critical' || i.health === 'warning' ||
    i.isBlocked || (i.ageDays ?? 0) > 14
  ).sort((a: any, b: any) => {
    const order: Record<string, number> = { critical: 0, warning: 1, good: 2 };
    return (order[a.health] ?? 9) - (order[b.health] ?? 9);
  });

  const rows: unknown[][] = [
    ['Issue Key', 'Summary', 'Type', 'Status', 'Assignee', 'Priority', 'Risk Level', 'Blocked', 'Reason', 'Age (days)', 'Sprint', 'Suggested Action'],
  ];

  for (const item of riskItems) {
    const action = item.health === 'critical'
      ? 'Escalate immediately — assign owner and resolution date'
      : item.health === 'warning'
      ? 'Review in next standup — prevent further aging'
      : 'Monitor — add to sprint backlog review';

    rows.push([
      item.key, item.summary, item.type, item.status, item.assignee,
      item.priority, item.health.toUpperCase(),
      item.isBlocked ? 'YES' : 'No',
      item.reason, item.ageDays ?? '—', item.sprint, action,
    ]);
  }

  if (riskItems.length === 0) rows.push(['No risk items detected — delivery health looks good.']);

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([12, 40, 14, 16, 18, 12, 12, 10, 40, 12, 20, 45]);
  return ws;
}

// ── Sheet 08: Orphan and Data Quality ────────────────────────────────────────

function sheetOrphanDataQuality(m: DashboardMetrics): XLSX.WorkSheet {
  const flow  = (m.flow ?? {}) as any;
  const items = (flow.items ?? []) as any[];

  const orphans   = items.filter((i: any) => i.isOrphan);
  const noSP      = items.filter((i: any) => !i.storyPoints || i.storyPoints === 0);
  const noAssignee = items.filter((i: any) => !i.assignee || i.assignee === 'Unassigned');
  const noSprint  = items.filter((i: any) => !i.sprint || i.sprint === 'No sprint');

  const rows: unknown[][] = [
    ['DATA QUALITY SUMMARY'],
    ['Issue Type', 'Count', '% of Total', 'Dashboard Impact', 'Suggested Fix'],
    ['Orphan (no Epic/Parent)', orphans.length, `${pct(orphans.length, items.length)}%`, 'Missing from epic/roadmap reporting', 'Link to parent Epic in Jira'],
    ['Missing Story Points', noSP.length, `${pct(noSP.length, items.length)}%`, 'Velocity and SP charts are incomplete', 'Estimate all active items in story points'],
    ['Unassigned Items', noAssignee.length, `${pct(noAssignee.length, items.length)}%`, 'Capacity and workload reporting unreliable', 'Assign all active items to a team member'],
    ['No Sprint Field', noSprint.length, `${pct(noSprint.length, items.length)}%`, 'Sprint throughput charts exclude these items', 'Add Sprint column to Jira export'],
    [],
    ['ORPHAN ITEMS DETAIL'],
    ['Issue Key', 'Summary', 'Type', 'Status', 'Assignee', 'Age (days)', 'Missing', 'Risk to Delivery'],
  ];

  for (const item of orphans.slice(0, 100)) {
    rows.push([
      item.key, item.summary, item.type, item.status, item.assignee,
      item.ageDays ?? '—',
      'Epic Link and Parent Key',
      'Not visible in roadmap or epic-level completion metrics',
    ]);
  }

  if (orphans.length === 0) rows.push(['No orphan items detected — hierarchy is complete.']);

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([12, 40, 14, 16, 18, 12, 22, 45]);
  return ws;
}

// ── Sheet 09: Assignee Workload ───────────────────────────────────────────────

function sheetAssigneeWorkload(m: DashboardMetrics): XLSX.WorkSheet {
  const capacity = (m.capacity ?? []) as any[];
  const flow     = (m.flow ?? {}) as any;
  const items    = (flow.items ?? []) as any[];
  const totalIssues = Math.max(items.length, 1);

  const rows: unknown[][] = [
    ['Assignee', 'Total', 'Done', 'Active', 'Blocked', 'Critical', 'Warning', 'Bugs', 'SP Total', 'SP Done', 'SP Remaining', 'Load %', 'Health Signal'],
  ];

  for (const cap of capacity) {
    const mi  = items.filter((i: any) => i.assignee === cap.assignee);
    const crit = mi.filter((i: any) => i.health === 'critical').length;
    const warn = mi.filter((i: any) => i.health === 'warning').length;
    const bugs = mi.filter((i: any) => (i.type ?? '').toLowerCase() === 'bug').length;
    const spRem = cap.storyPoints - cap.doneStoryPoints;
    const signal = cap.loadShare > 40 ? 'Overloaded' : cap.loadShare > 25 ? 'High' : cap.loadShare > 10 ? 'Balanced' : 'Under-allocated';
    rows.push([
      cap.assignee, cap.issues, cap.doneIssues, cap.activeIssues,
      cap.issues - cap.doneIssues - cap.activeIssues,
      crit, warn, bugs,
      cap.storyPoints, cap.doneStoryPoints, spRem,
      `${cap.loadShare}%`, signal,
    ]);
  }

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([22, 8, 8, 8, 10, 10, 10, 8, 10, 10, 14, 10, 16]);
  return ws;
}

// ── Sheet 10: Story Points Analysis ──────────────────────────────────────────

function sheetStoryPointsAnalysis(m: DashboardMetrics): XLSX.WorkSheet {
  const sp    = (m.storyPoints ?? {}) as any;
  const flow  = (m.flow ?? {}) as any;
  const items = (flow.items ?? []) as any[];
  const sprint = m.throughput?.sprint;

  const byPoints: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '5': 0, '8': 0, '13': 0, '21+': 0 };
  for (const item of items) {
    const p = item.storyPoints ?? 0;
    if (p === 0)       byPoints['0']++;
    else if (p === 1)  byPoints['1']++;
    else if (p === 2)  byPoints['2']++;
    else if (p === 3)  byPoints['3']++;
    else if (p === 5)  byPoints['5']++;
    else if (p === 8)  byPoints['8']++;
    else if (p === 13) byPoints['13']++;
    else               byPoints['21+']++;
  }

  const rows: unknown[][] = [
    ['STORY POINTS SUMMARY'],
    ['Total Story Points', sp.totalStoryPoints ?? 0],
    ['Completed Story Points', sp.completedStoryPoints ?? 0],
    ['Remaining Story Points', sp.remainingStoryPoints ?? 0],
    ['Completion Rate', `${sp.pointCompletionRate ?? 0}%`],
    ...(sprint && sprint.totalSprints > 0 ? [
      ['Avg SP / Sprint', sprint.averageThroughputPoints],
      ['Sprints to Complete (estimate)', sprint.averageThroughputPoints > 0
        ? Math.ceil((sp.remainingStoryPoints ?? 0) / sprint.averageThroughputPoints)
        : 'N/A'],
    ] : []),
    [],
    ['STORY POINT DISTRIBUTION'],
    ['Points', 'Issue Count', '% of Total'],
    ...Object.entries(byPoints).map(([pt, count]) => [pt, count, `${pct(count, items.length)}%`]),
    [],
    ['ITEMS WITHOUT STORY POINTS'],
    ['Count', items.filter((i: any) => !i.storyPoints || i.storyPoints === 0).length],
    ['% of Total', `${pct(items.filter((i: any) => !i.storyPoints || i.storyPoints === 0).length, items.length)}%`],
    ['Note', 'Items without story points are excluded from velocity-based forecasts.'],
  ];

  const ws = makeWs(rows);
  ws['!cols'] = colWidths([30, 20, 15]);
  return ws;
}

// ── Sheet 11: Cycle Time and Lead Time ───────────────────────────────────────

function sheetCycleLeadTime(m: DashboardMetrics): XLSX.WorkSheet {
  const flow  = (m.flow ?? {}) as any;
  const items = (flow.items ?? []) as any[];

  const done = items.filter((i: any) => i.leadTimeDays != null || i.cycleTimeDays != null);
  const leads = done.map((i: any) => i.leadTimeDays).filter((n: any) => n != null) as number[];
  const cycles = done.map((i: any) => i.cycleTimeDays).filter((n: any) => n != null) as number[];

  function percentile(arr: number[], p: number): number {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  const rows: unknown[][] = [
    ['LEAD TIME AND CYCLE TIME ANALYSIS'],
    [],
    ['Metric', 'Lead Time (days)', 'Cycle Time (days)'],
    ['Average', round1(leads.reduce((a, b) => a + b, 0) / (leads.length || 1)), round1(cycles.reduce((a, b) => a + b, 0) / (cycles.length || 1))],
    ['Median (P50)', percentile(leads, 50), percentile(cycles, 50)],
    ['P75', percentile(leads, 75), percentile(cycles, 75)],
    ['P85', percentile(leads, 85), percentile(cycles, 85)],
    ['P95', percentile(leads, 95), percentile(cycles, 95)],
    ['Min', leads.length ? Math.min(...leads) : 0, cycles.length ? Math.min(...cycles) : 0],
    ['Max', leads.length ? Math.max(...leads) : 0, cycles.length ? Math.max(...cycles) : 0],
    ['Sample Size', leads.length, cycles.length],
    [],
    ['INTERPRETATION'],
    ['P50 (Median)', 'Half of items completed faster than this — more reliable than average for planning.'],
    ['P85', 'Use this as your delivery SLA — 85% of items completed within this many days.'],
    ['P95', 'Worst-case scenario — only 5% of items take longer than this.'],
    [],
    ['TOP 20 SLOWEST ITEMS (by Lead Time)'],
    ['Issue Key', 'Summary', 'Type', 'Status', 'Lead Time (days)', 'Cycle Time (days)', 'Assignee'],
    ...items
      .filter((i: any) => i.leadTimeDays != null)
      .sort((a: any, b: any) => (b.leadTimeDays ?? 0) - (a.leadTimeDays ?? 0))
      .slice(0, 20)
      .map((i: any) => [i.key, i.summary, i.type, i.status, i.leadTimeDays, i.cycleTimeDays ?? '—', i.assignee]),
  ];

  const ws = makeWs(rows);
  ws['!cols'] = colWidths([28, 18, 18, 12, 12, 14]);
  return ws;
}

// ── Sheet 12: Throughput Trends ───────────────────────────────────────────────

function sheetThroughputTrends(m: DashboardMetrics): XLSX.WorkSheet {
  const sprint = m.throughput?.sprint;
  const kanban = m.throughput?.kanban;

  const rows: unknown[][] = [
    ['THROUGHPUT TRENDS'],
    [],
  ];

  if (sprint && sprint.totalSprints > 0) {
    rows.push(['SPRINT THROUGHPUT TREND']);
    rows.push(['Sprint', 'Throughput (issues)', 'Throughput (SP)', 'Completion %', 'vs Previous', 'Direction']);
    const sprints = [...sprint.sprints].reverse();
    sprints.forEach((s, i) => {
      const prev = sprints[i - 1];
      const delta = prev ? s.throughputByCount - prev.throughputByCount : 0;
      rows.push([
        s.sprintName,
        s.throughputByCount,
        s.throughputByPoints,
        `${s.completionPct}%`,
        i === 0 ? '—' : (delta > 0 ? `+${delta}` : `${delta}`),
        i === 0 ? '—' : delta > 0 ? 'Improving' : delta < 0 ? 'Declining' : 'Stable',
      ]);
    });
    rows.push([]);
    rows.push(['Overall Trend', sprint.trendDirection, `${sprint.deliveryTrendValue > 0 ? '+' : ''}${sprint.deliveryTrendValue} issues vs prev 3 sprints avg`]);
    rows.push([]);
  }

  if (kanban?.hasKanbanData && kanban.periods.length > 0) {
    rows.push(['KANBAN THROUGHPUT TREND']);
    rows.push(['Period', 'Throughput (issues)', 'SP Done', 'vs Previous', 'Flow Health']);
    const periods = [...kanban.periods].reverse();
    periods.forEach((p, i) => {
      const prev = periods[i - 1];
      const delta = prev ? p.completedCount - prev.completedCount : 0;
      rows.push([p.periodLabel, p.completedCount, p.completedPoints, i === 0 ? '—' : (delta > 0 ? `+${delta}` : `${delta}`), p.flowHealth]);
    });
  }

  const ws = makeWs(rows);
  ws['!cols'] = colWidths([28, 22, 18, 16, 16, 14]);
  return ws;
}

// ── Sheet 13: Recommendations ────────────────────────────────────────────────

function sheetRecommendations(recs: ReturnType<typeof generateRecommendations>): XLSX.WorkSheet {
  const rows: unknown[][] = [
    ['Priority', 'Area', 'Recommendation', 'Evidence', 'Impact', 'Suggested Owner', 'Suggested Action'],
    ...recs.map(r => [r.priority, r.area, r.text, r.evidence, r.impact, r.suggestedOwner, r.suggestedAction]),
  ];

  if (recs.length === 0) rows.push(['Low', 'Delivery', 'No recommendations — delivery health looks good.', '', '', '', '']);

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([12, 12, 45, 45, 35, 25, 50]);
  return ws;
}

// ── Sheet 14: Release Readiness ───────────────────────────────────────────────

function sheetReleaseReadiness(m: DashboardMetrics): XLSX.WorkSheet {
  const flow  = (m.flow ?? {}) as any;
  const items = (flow.items ?? []) as any[];

  // Group by Fix Version
  const byVersion: Record<string, any[]> = {};
  for (const item of items) {
    const ver = (item as any).fixVersion || (item as any).labels || 'No Release';
    if (!byVersion[ver]) byVersion[ver] = [];
    byVersion[ver].push(item);
  }

  const rows: unknown[][] = [
    ['Fix Version / Release', 'Scope', 'Done', 'Open', 'Bugs', 'Blocked', 'Critical', 'Completion %', 'Readiness'],
  ];

  const norm = (s: string) => s.toLowerCase();
  const isDone = (i: any) => ['done', 'closed', 'resolved'].includes(norm(i.status ?? ''));
  const isBug  = (i: any) => norm(i.type ?? '') === 'bug';

  for (const [ver, its] of Object.entries(byVersion).slice(0, 20)) {
    const done   = its.filter(isDone).length;
    const bugs   = its.filter(isBug).filter(i => !isDone(i)).length;
    const blocked = its.filter((i: any) => i.health === 'critical').length;
    const crit   = its.filter((i: any) => i.health === 'critical').length;
    const comp   = pct(done, its.length);
    const ready  = comp >= 95 && blocked === 0 && bugs === 0 ? 'Go'
                 : comp >= 80 && blocked <= 1  ? 'Conditional Go'
                 : 'No-Go';
    rows.push([ver, its.length, done, its.length - done, bugs, blocked, crit, `${comp}%`, ready]);
  }

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([24, 10, 8, 8, 8, 10, 10, 14, 16]);
  return ws;
}

// ── Sheet 15: Dependencies ────────────────────────────────────────────────────

function sheetDependencies(m: DashboardMetrics): XLSX.WorkSheet {
  const flow  = (m.flow ?? {}) as any;
  const items = (flow.items ?? []) as any[];
  const rels  = (m.relations as any) ?? {};

  const rows: unknown[][] = [
    ['Issue Key', 'Summary', 'Type', 'Status', 'Assignee', 'Linked To', 'Link Type', 'Health'],
  ];

  const linked = items.filter((i: any) => i.linkedTo && i.linkedTo.trim() !== '');
  for (const item of linked) {
    rows.push([item.key, item.summary, item.type, item.status, item.assignee, item.linkedTo, 'Linked', item.health]);
  }

  if (linked.length === 0) {
    rows.push(['No linked issues found. Re-export Jira with linked issue columns to see dependency data.']);
  }

  rows.push([]);
  rows.push(['DEPENDENCY SUMMARY']);
  rows.push(['Total linked items', linked.length]);
  rows.push(['Link types found', rels.hasLinks ? 'Yes' : 'No']);

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([12, 40, 14, 16, 18, 30, 14, 12]);
  return ws;
}

// ── Sheet 16: Metric Dictionary ───────────────────────────────────────────────

function sheetMetricDictionary(): XLSX.WorkSheet {
  const rows: unknown[][] = [
    ['Metric', 'Definition', 'Formula / Source', 'Unit', 'Good Range', 'Notes'],
    ['Health Score', 'Overall delivery health composite', 'Weighted: completion(25%) + flow(20%) + trend(15%) + cycle time(15%) + blocked ratio(15%) + orphan ratio(10%)', '0–100', '75–100', 'Higher = healthier delivery'],
    ['Completion Rate', 'Percentage of issues marked Done', 'Done Issues / Total Issues × 100', '%', '80%+', ''],
    ['Lead Time', 'Time from issue created to Done', 'Done Date − Created Date', 'days', '≤14 days', 'Measures end-to-end process speed'],
    ['Cycle Time', 'Time from work started to Done', 'Done Date − In Progress Date', 'days', '≤7 days', 'Measures execution speed'],
    ['Flow Efficiency', 'Ratio of active work time to total lead time', 'Cycle Time / Lead Time × 100', '%', '40%+', 'Low = large queues'],
    ['Throughput', 'Number of items completed in a period', 'COUNT(Done) per sprint or period', 'issues/period', 'Stable or increasing', ''],
    ['Mid-Sprint %', 'Completion percentage at sprint midpoint', 'Done by midpoint / Committed × 100', '%', '≥50%', 'Below 20% = end-loaded sprint risk'],
    ['Sprint Completion', 'Sprint committed vs actually done', 'Completed / Committed × 100', '%', '80–100%', ''],
    ['Delivery Confidence', 'Estimate of sprint delivery reliability', 'Weighted: completion(60%) − blocked ratio(30%) − added scope ratio(20%)', '0–100', '70%+', ''],
    ['Orphan Issue', 'Issue with no Epic Link and no Parent Key', 'Epic Link IS NULL AND Parent Key IS NULL', 'count', '0', 'Orphans are invisible in epic reporting'],
    ['Aging WIP', 'Active items that have been in progress too long', 'Active items with age > 14 days', 'count', '0', 'Signals blockers or over-commitment'],
    ['Blocked Ratio', 'Proportion of issues that are blocked', 'Blocked Issues / Total Issues × 100', '%', '0%', 'Any blocked item is a delivery risk'],
    ['Delivery Trend', 'Change in throughput vs previous periods', 'Avg(last 3 sprints) − Avg(prev 3 sprints)', 'issues', 'Positive', 'Positive = improving; negative = declining'],
    ['WIP Average', 'Average number of items actively in progress', 'AVG(active issues per day in period)', 'count', 'Within team WIP limit', ''],
    ['Goal Outcome', 'Sprint goal achievement classification', 'Met ≥90%, Partially Met ≥60%, Missed <60%', 'label', 'Met', ''],
    ['Story Point Completion', 'Percentage of committed points delivered', 'Done SP / Committed SP × 100', '%', '80%+', 'Requires Story Points column in export'],
    ['P85 Lead Time', '85th percentile lead time — use as delivery SLA', 'Sort lead times ascending, take value at 85th percentile', 'days', 'Team-specific', 'More reliable than max for SLA-setting'],
  ];

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([22, 40, 50, 10, 14, 35]);
  return ws;
}

// ── Sheet 17: Raw Data Reference ─────────────────────────────────────────────

function sheetRawDataReference(m: DashboardMetrics): XLSX.WorkSheet {
  const flow  = (m.flow ?? {}) as any;
  const items = (flow.items ?? []) as any[];

  const rows: unknown[][] = [
    ['Issue Key', 'Type', 'Status', 'Assignee', 'Sprint', 'Epic', 'Priority', 'Story Points', 'Health', 'Lead Time (d)', 'Cycle Time (d)', 'Age (d)', 'Created', 'Started', 'Done', 'Orphan', 'Project'],
    ...items.map((i: any) => [
      i.key, i.type, i.status, i.assignee, i.sprint, i.epic,
      i.priority, i.storyPoints || 0, i.health,
      i.leadTimeDays ?? '—', i.cycleTimeDays ?? '—', i.ageDays ?? '—',
      i.createdDate, i.startedDate, i.doneDate,
      i.isOrphan ? 'YES' : 'No', i.project,
    ]),
  ];

  const ws = makeWs(rows);
  freezeRow(ws);
  ws['!cols'] = colWidths([12, 14, 16, 18, 22, 18, 12, 14, 12, 14, 14, 10, 14, 14, 14, 10, 14]);
  return ws;
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

export function buildInsightWorkbook(metrics: DashboardMetrics): XLSX.WorkBook {
  const wb   = XLSX.utils.book_new();
  const recs = generateRecommendations(metrics);

  const sheets: [string, XLSX.WorkSheet][] = [
    ['01 Executive Summary',      sheetExecutiveSummary(metrics, recs)],
    ['02 Project Health',         sheetProjectHealth(metrics)],
    ['03 Team Performance',       sheetTeamPerformance(metrics)],
    ['04 Sprint Throughput',      sheetSprintThroughput(metrics)],
    ['05 Mid-Sprint Delivery',    sheetMidSprintDelivery(metrics)],
    ['06 Kanban Flow',            sheetKanbanFlow(metrics)],
    ['07 Risks and Blockers',     sheetRisksAndBlockers(metrics)],
    ['08 Orphan & Data Quality',  sheetOrphanDataQuality(metrics)],
    ['09 Assignee Workload',      sheetAssigneeWorkload(metrics)],
    ['10 Story Points Analysis',  sheetStoryPointsAnalysis(metrics)],
    ['11 Cycle & Lead Time',      sheetCycleLeadTime(metrics)],
    ['12 Throughput Trends',      sheetThroughputTrends(metrics)],
    ['13 Recommendations',        sheetRecommendations(recs)],
    ['14 Release Readiness',      sheetReleaseReadiness(metrics)],
    ['15 Dependencies',           sheetDependencies(metrics)],
    ['16 Metric Dictionary',      sheetMetricDictionary()],
    ['17 Raw Data Reference',     sheetRawDataReference(metrics)],
  ];

  for (const [name, ws] of sheets) {
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  return wb;
}

export function downloadInsightWorkbook(metrics: DashboardMetrics, filename = 'delivery-clarity-report.xlsx'): void {
  const wb = buildInsightWorkbook(metrics);
  XLSX.writeFile(wb, filename);
}
