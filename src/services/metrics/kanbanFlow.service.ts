// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Kanban flow analytics.
// Groups non-sprint issues by monthly reporting period and computes:
// throughput, cycle time, lead time, WIP average, aging WIP, flow efficiency,
// bottleneck status, and flow health — all from static Jira export data.

import type {
  KanbanPeriod,
  KanbanFlowSummary,
  KanbanBottleneckStatus,
  KanbanFlowHealth,
} from '@/types/throughput';

type JiraIssue = Record<string, unknown>;

// ── Constants ─────────────────────────────────────────────────────────────────
const DONE_STATUSES   = new Set(['done', 'closed', 'resolved']);
const ACTIVE_STATUSES = new Set(['in progress', 'code review', 'qa', 'testing', 'uat', 'review']);
const AGING_WIP_DAYS  = 14;

function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }

function isDone(issue: JiraIssue): boolean { return DONE_STATUSES.has(norm(issue['Status'])); }
function isActive(issue: JiraIssue): boolean { return ACTIVE_STATUSES.has(norm(issue['Status'])); }
function isBlocked(issue: JiraIssue): boolean {
  return issue['Blocked Flag'] === true || norm(issue['Blocked Flag']) === 'true' || norm(issue['Blocked Flag']) === 'yes';
}
function isReopened(issue: JiraIssue): boolean {
  const count = Number(issue['Reopened Count'] ?? 0);
  return Number.isFinite(count) && count > 0;
}

const MONTHS_MAP: Record<string, number> = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value).trim();
  if (!text) return null;

  const serial = Number(text);
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    return new Date(new Date(Date.UTC(1899, 11, 30)).getTime() + serial * 86_400_000);
  }

  const jira = text.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})/i);
  if (jira) {
    const [, d, m, y] = jira;
    return new Date(Number(y) < 100 ? Number(y) + 2000 : Number(y), MONTHS_MAP[m.toLowerCase()] ?? 0, Number(d));
  }

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const num = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (num) {
    const [, a, b, y] = num;
    const yr = Number(y) < 100 ? Number(y) + 2000 : Number(y);
    return Number(b) > 12 ? new Date(yr, Number(a) - 1, Number(b)) : new Date(yr, Number(b) - 1, Number(a));
  }

  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getDoneDate(issue: JiraIssue): Date | null {
  return parseDate(issue['Done Date']) ?? parseDate(issue['Resolution Date']);
}

function getCreatedDate(issue: JiraIssue): Date | null {
  return parseDate(issue['Created Date']);
}

function getStartedDate(issue: JiraIssue): Date | null {
  return parseDate(issue['In Progress Date']) ?? parseDate(issue['Sprint Start']);
}

function getStoryPoints(issue: JiraIssue): number {
  const n = Number(issue['Story Points']);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function getTeam(issue: JiraIssue): string {
  return (issue['Team'] as string) || 'Kanban';
}

// ── Period label helpers ──────────────────────────────────────────────────────

function periodKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function periodLabel(key: string): string {
  const [y, m] = key.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[Number(m) - 1]} ${y}`;
}

function periodBounds(key: string): { start: string; end: string } {
  const [y, m] = key.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end   = new Date(y, m, 0); // last day of month
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
  };
}

// ── Flow efficiency: cycleTime / leadTime × 100 ───────────────────────────────

function flowEfficiency(cycleTimeDays: number, leadTimeDays: number): number {
  if (leadTimeDays <= 0) return 0;
  return Math.round(Math.min(100, (cycleTimeDays / leadTimeDays) * 100));
}

// ── Bottleneck + flow health ──────────────────────────────────────────────────

function bottleneck(agingWip: number, blocked: number, total: number): KanbanBottleneckStatus {
  if (total === 0) return 'None';
  const riskRatio = (agingWip + blocked) / total;
  if (riskRatio > 0.40) return 'Severe';
  if (riskRatio > 0.25) return 'Moderate';
  if (riskRatio > 0.10) return 'Mild';
  return 'None';
}

function flowHealth(
  efficiencyPct: number,
  bottle: KanbanBottleneckStatus,
): KanbanFlowHealth {
  if (bottle === 'Severe' || efficiencyPct < 30) return 'Degraded';
  if (bottle === 'Moderate' || efficiencyPct < 50) return 'At Risk';
  return 'Healthy';
}

// ── Average helper ────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function calculateKanbanFlow(issues: JiraIssue[]): KanbanFlowSummary {
  const today = new Date();

  // Kanban issues = issues WITHOUT a sprint field
  const kanbanIssues = issues.filter(i =>
    !i['Sprint'] && !i['Actual Sprint'] && !i['Planned Sprint'],
  );

  if (!kanbanIssues.length) {
    return { hasKanbanData: false, periods: [], avgThroughputPerPeriod: 0,
             avgCycleTimeDays: 0, avgLeadTimeDays: 0, avgFlowEfficiencyPct: 0,
             totalAgingWip: 0, overallFlowHealth: 'Healthy' };
  }

  // Group done issues by the month they were completed
  const periodMap = new Map<string, JiraIssue[]>();

  for (const issue of kanbanIssues) {
    const doneDate = getDoneDate(issue);
    if (!doneDate || !isDone(issue)) continue;
    const key = periodKey(doneDate);
    if (!periodMap.has(key)) periodMap.set(key, []);
    periodMap.get(key)!.push(issue);
  }

  // Active + aging WIP — all active Kanban issues at "today"
  const activeIssues = kanbanIssues.filter(isActive);
  const agingWip     = activeIssues.filter(i => {
    const created = getCreatedDate(i);
    if (!created) return false;
    return Math.round((today.getTime() - created.getTime()) / 86_400_000) > AGING_WIP_DAYS;
  });
  const totalAgingWip = agingWip.length;

  // Build periods sorted by date descending
  const sortedKeys = [...periodMap.keys()].sort((a, b) => b.localeCompare(a));

  const periods: KanbanPeriod[] = sortedKeys.map((key, idx) => {
    const doneItems   = periodMap.get(key)!;
    const prevKey     = sortedKeys[idx + 1];
    const prevCount   = prevKey ? (periodMap.get(prevKey)?.length ?? 0) : doneItems.length;
    const bounds      = periodBounds(key);

    const cycleTimes: number[] = [];
    const leadTimes:  number[] = [];

    for (const issue of doneItems) {
      const created = getCreatedDate(issue);
      const started = getStartedDate(issue);
      const done    = getDoneDate(issue);
      if (created && done) leadTimes.push(Math.round((done.getTime() - created.getTime()) / 86_400_000));
      if (started && done) cycleTimes.push(Math.round((done.getTime() - started.getTime()) / 86_400_000));
    }

    const avgCycle = avg(cycleTimes);
    const avgLead  = avg(leadTimes);
    const eff      = flowEfficiency(avgCycle, avgLead);

    // Period-level active issues (approximation: active issues created before period end)
    const periodEnd  = new Date(bounds.end);
    const periodActive = kanbanIssues.filter(i => {
      const created = getCreatedDate(i);
      return created && created <= periodEnd && (isActive(i) || isDone(i));
    });
    const periodBlocked  = periodActive.filter(isBlocked).length;
    const periodReopened = doneItems.filter(isReopened).length;
    const periodAging    = periodActive.filter(i => {
      const created = getCreatedDate(i);
      if (!created) return false;
      return Math.round((periodEnd.getTime() - created.getTime()) / 86_400_000) > AGING_WIP_DAYS;
    }).length;

    const completedPoints = doneItems.reduce((s, i) => s + getStoryPoints(i), 0);
    const bottle  = bottleneck(periodAging, periodBlocked, periodActive.length);
    const health  = flowHealth(eff, bottle);
    const trend   = doneItems.length - prevCount;

    const team = getTeam(doneItems[0] ?? kanbanIssues[0]);

    return {
      team,
      periodLabel: periodLabel(key),
      periodStart: bounds.start,
      periodEnd:   bounds.end,
      completedCount:    doneItems.length,
      completedPoints:   Math.round(completedPoints),
      avgCycleTimeDays:  avgCycle,
      avgLeadTimeDays:   avgLead,
      wipAverage:        periodActive.length,
      agingWipCount:     periodAging,
      blockedCount:      periodBlocked,
      reopenedCount:     periodReopened,
      throughputTrend:   trend,
      flowEfficiencyPct: eff,
      bottleneckStatus:  bottle,
      flowHealth:        health,
    };
  });

  // Overall aggregates
  const allCycleTimes: number[] = [];
  const allLeadTimes:  number[] = [];
  for (const issue of kanbanIssues) {
    const created = getCreatedDate(issue);
    const started = getStartedDate(issue);
    const done    = getDoneDate(issue);
    if (!isDone(issue)) continue;
    if (created && done) allLeadTimes.push(Math.round((done.getTime() - created.getTime()) / 86_400_000));
    if (started && done) allCycleTimes.push(Math.round((done.getTime() - started.getTime()) / 86_400_000));
  }

  const avgCycle = avg(allCycleTimes);
  const avgLead  = avg(allLeadTimes);
  const avgEff   = periods.length ? Math.round(periods.reduce((s, p) => s + p.flowEfficiencyPct, 0) / periods.length) : 0;
  const avgTP    = periods.length ? Math.round(periods.reduce((s, p) => s + p.completedCount, 0) / periods.length) : 0;

  // Overall health: worst of any period (simplified)
  const overallHealth: KanbanFlowHealth =
    periods.some(p => p.flowHealth === 'Degraded') ? 'Degraded' :
    periods.some(p => p.flowHealth === 'At Risk')  ? 'At Risk' : 'Healthy';

  return {
    hasKanbanData: true,
    periods,
    avgThroughputPerPeriod: avgTP,
    avgCycleTimeDays:       avgCycle,
    avgLeadTimeDays:        avgLead,
    avgFlowEfficiencyPct:   avgEff,
    totalAgingWip,
    overallFlowHealth:      overallHealth,
  };
}
