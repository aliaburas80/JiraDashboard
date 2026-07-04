// © 2025 Ali Abu Ras — aburasali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Sprint throughput service.
// Calculates per-sprint committed/completed counts, story points, carryover,
// scope changes, goal outcome, delivery confidence and cross-sprint averages.
// Works entirely from static Jira export data — no live API required.

import type {
  SprintThroughput,
  SprintThroughputSummary,
  SprintGoalOutcome,
  SprintDeliveryPattern,
  TrendDirection,
} from '@/types/throughput';

type JiraIssue = Record<string, unknown>;

// ── Field helpers ─────────────────────────────────────────────────────────────

const DONE_STATUSES = new Set(['done', 'closed', 'resolved']);
const BUG_TYPES     = new Set(['bug', 'defect', 'error']);

function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }

function getSprintName(issue: JiraIssue): string {
  return (
    (issue['Sprint'] as string) ||
    (issue['Actual Sprint'] as string) ||
    (issue['Planned Sprint'] as string) ||
    'No sprint'
  );
}

function getTeam(issue: JiraIssue): string {
  return (issue['Team'] as string) || (issue['Assignee'] as string) || 'Unknown';
}

function getStoryPoints(issue: JiraIssue): number {
  const raw = issue['Story Points'];
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function isDone(issue: JiraIssue): boolean {
  return DONE_STATUSES.has(norm(issue['Status']));
}

function isBug(issue: JiraIssue): boolean {
  return BUG_TYPES.has(norm(issue['Issue Type']));
}

function isBlocked(issue: JiraIssue): boolean {
  return (
    issue['Blocked Flag'] === true ||
    norm(issue['Blocked Flag']) === 'true' ||
    norm(issue['Blocked Flag']) === 'yes'
  );
}

function isAddedAfterStart(issue: JiraIssue): boolean {
  return (
    norm(issue['Added After Sprint Start']) === 'true' ||
    norm(issue['Commitment Type']) === 'added' ||
    norm(issue['Scope Change Type']) === 'added'
  );
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
};

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const text = String(value).trim();
  if (!text) return null;

  // Excel serial
  const serial = Number(text);
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + serial * 86_400_000);
  }

  // Jira: 01/Jan/2024
  const jira = text.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})/i);
  if (jira) {
    const [, d, m, y] = jira;
    return new Date(Number(y) < 100 ? Number(y) + 2000 : Number(y), MONTHS[m.toLowerCase()] ?? 0, Number(d));
  }

  // ISO / numeric variants
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const num = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (num) {
    const [, a, b, y] = num;
    const yr = Number(y) < 100 ? Number(y) + 2000 : Number(y);
    // prefer DD/MM or MM/DD heuristic: whichever second part > 12 is the day
    return Number(b) > 12
      ? new Date(yr, Number(a) - 1, Number(b))
      : new Date(yr, Number(b) - 1, Number(a));
  }

  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIso(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function midDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.floor((end.getTime() - start.getTime()) / 2));
}

function daysBetween(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ── Sprint date resolution ────────────────────────────────────────────────────
// Uses explicit Sprint Start/Sprint End fields first.
// Falls back to deriving from the issue pool inside the sprint:
//   start = earliest created date, end = latest done date (or today).

function resolveSprintDates(
  issues: JiraIssue[],
): { start: Date | null; end: Date | null } {
  // Check any issue in the group for explicit sprint dates
  for (const issue of issues) {
    const start = parseDate(issue['Sprint Start']);
    const end   = parseDate(issue['Sprint End']);
    if (start && end) return { start, end };
  }

  // Fallback: derive from issue dates
  const created = issues.map(i => parseDate(i['Created Date'])).filter(Boolean) as Date[];
  const done    = issues
    .filter(isDone)
    .map(i => parseDate(i['Done Date']) ?? parseDate(i['Resolution Date']))
    .filter(Boolean) as Date[];

  const start = created.length ? new Date(Math.min(...created.map(d => d.getTime()))) : null;
  const end   = done.length   ? new Date(Math.max(...done.map(d => d.getTime())))    : null;

  return { start, end };
}

// ── Goal outcome ──────────────────────────────────────────────────────────────

function goalOutcome(
  completionPct: number,
  sprintEnd: Date | null,
): SprintGoalOutcome {
  const today = new Date();
  const isActive = sprintEnd ? sprintEnd > today : false;
  if (isActive && completionPct < 60) return 'At Risk';
  if (completionPct >= 90) return 'Met';
  if (completionPct >= 60) return 'Partially Met';
  return 'Missed';
}

// ── Delivery pattern ──────────────────────────────────────────────────────────

function detectPattern(
  midPct: number,
  addedScopeCount: number,
  committedCount: number,
  blockedCount: number,
): SprintDeliveryPattern {
  if (blockedCount >= 2)                              return 'Blocked Sprint';
  if (committedCount > 0 && addedScopeCount / committedCount > 0.20) return 'Scope Instability';
  if (midPct >= 50)                                  return 'Healthy Early Progress';
  if (midPct >= 30)                                  return 'Late Delivery Risk';
  return 'End-Loaded Sprint';
}

function patternText(pattern: SprintDeliveryPattern, midPct: number): string {
  switch (pattern) {
    case 'Healthy Early Progress':
      return `${midPct}% of work completed by mid-sprint — team is delivering consistently throughout the sprint.`;
    case 'End-Loaded Sprint':
      return `Only ${midPct}% done by mid-sprint — most work completed in the final days. Consider daily reviews and smaller stories.`;
    case 'Late Delivery Risk':
      return `${midPct}% done by mid-sprint. Delivery is lagging; risk of incomplete sprint if blockers arise.`;
    case 'Scope Instability':
      return `Significant scope was added after sprint start. This destabilises commitment accuracy and throughput comparisons.`;
    case 'Blocked Sprint':
      return `Multiple blocked items detected. Sprint velocity is constrained by external blockers — escalation recommended.`;
    default:
      return 'Insufficient sprint date data to analyse mid-sprint delivery pattern.';
  }
}

// ── Delivery confidence ───────────────────────────────────────────────────────

function calcConfidence(
  completionPct: number,
  blockedRatio: number,
  addedRatio: number,
): number {
  let score = completionPct * 0.6;
  score -= blockedRatio * 30;
  score -= addedRatio  * 20;
  return Math.round(Math.max(0, Math.min(100, score)));
}

// ── Trend ─────────────────────────────────────────────────────────────────────

function calcTrend(throughputs: number[]): { value: number; direction: TrendDirection } {
  if (throughputs.length < 2) return { value: 0, direction: 'Stable' };
  const last3  = throughputs.slice(0, 3);
  const prev3  = throughputs.slice(3, 6);
  const avgLast = last3.reduce((a, b) => a + b, 0) / last3.length;
  const avgPrev = prev3.length ? prev3.reduce((a, b) => a + b, 0) / prev3.length : avgLast;
  const delta = Math.round(avgLast - avgPrev);
  const pct   = avgPrev > 0 ? Math.abs(delta) / avgPrev : 0;
  const direction: TrendDirection = pct < 0.05 ? 'Stable' : delta > 0 ? 'Improving' : 'Declining';
  return { value: delta, direction };
}

// ── Group-by helper ───────────────────────────────────────────────────────────

function groupBy<T>(items: T[], key: (i: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

// ── Main calculation ──────────────────────────────────────────────────────────

export function calculateSprintThroughput(issues: JiraIssue[]): SprintThroughputSummary {
  const sprintIssues = issues.filter(i =>
    i['Sprint'] || i['Actual Sprint'] || i['Planned Sprint'],
  );

  if (!sprintIssues.length) {
    return emptySummary();
  }

  const groups = groupBy(sprintIssues, getSprintName);
  const sprints: SprintThroughput[] = [];

  for (const [name, items] of groups) {
    if (name === 'No sprint') continue;

    const { start, end } = resolveSprintDates(items);
    const mid             = start && end ? midDate(start, end) : null;

    const committedCount  = items.length;
    const committedPoints = items.reduce((s, i) => s + getStoryPoints(i), 0);

    // Done within sprint window (or any done if no window resolved)
    const completedItems  = items.filter(i => {
      if (!isDone(i)) return false;
      if (!end) return true;
      const done = parseDate(i['Done Date']) ?? parseDate(i['Resolution Date']);
      return done ? done <= end : true;
    });

    const completedCount  = completedItems.length;
    const completedPoints = completedItems.reduce((s, i) => s + getStoryPoints(i), 0);

    // Mid-sprint done
    const midItems = mid
      ? completedItems.filter(i => {
          const done = parseDate(i['Done Date']) ?? parseDate(i['Resolution Date']);
          return done ? done <= mid : false;
        })
      : [];
    const midDoneCount  = midItems.length;
    const midDonePoints = midItems.reduce((s, i) => s + getStoryPoints(i), 0);
    const midSprintPct  = committedCount > 0
      ? Math.round((midDoneCount / committedCount) * 100)
      : 0;

    const completionPct      = committedCount > 0 ? Math.round((completedCount / committedCount) * 100) : 0;
    const pointCompletionPct = committedPoints > 0 ? Math.round((completedPoints / committedPoints) * 100) : 0;

    const addedScopeCount  = items.filter(isAddedAfterStart).length;
    const blockedCount     = items.filter(isBlocked).length;
    const bugsCompleted    = completedItems.filter(isBug).length;
    const bugsOpen         = items.filter(i => isBug(i) && !isDone(i)).length;

    // Carryover = committed items NOT completed by sprint end (and not removed)
    const carryoverCount = committedCount - completedCount - (0 /* no remove field yet */);

    const team    = getTeam(items[0]);
    const pattern = start && end
      ? detectPattern(midSprintPct, addedScopeCount, committedCount, blockedCount)
      : 'Unknown';

    sprints.push({
      sprintName: name,
      team,
      sprintStart:    toIso(start),
      sprintEnd:      toIso(end),
      sprintMidpoint: toIso(mid),
      committedCount,
      committedPoints: Math.round(committedPoints),
      completedCount,
      completedPoints: Math.round(completedPoints),
      completionPct,
      pointCompletionPct,
      throughputByCount:  completedCount,
      throughputByPoints: Math.round(completedPoints),
      midSprintDoneCount:  midDoneCount,
      midSprintDonePoints: Math.round(midDonePoints),
      midSprintPct,
      carryoverCount:   Math.max(0, carryoverCount),
      addedScopeCount,
      removedScopeCount: 0,
      blockedCount,
      bugsCompleted,
      bugsOpen,
      goalOutcome: goalOutcome(completionPct, end),
      deliveryPattern: pattern,
      patternInterpretation: patternText(pattern, midSprintPct),
      deliveryConfidence: calcConfidence(
        completionPct,
        committedCount > 0 ? blockedCount / committedCount : 0,
        committedCount > 0 ? addedScopeCount / committedCount : 0,
      ),
    });
  }

  // Sort: most recently resolved first (by sprintEnd desc, then name)
  sprints.sort((a, b) => {
    if (a.sprintEnd && b.sprintEnd) return b.sprintEnd.localeCompare(a.sprintEnd);
    return a.sprintName.localeCompare(b.sprintName);
  });

  const throughputs = sprints.map(s => s.throughputByCount);
  const trend       = calcTrend(throughputs);

  const avgThroughputCount  = sprints.length
    ? Math.round(sprints.reduce((s, sp) => s + sp.throughputByCount, 0) / sprints.length)
    : 0;
  const avgThroughputPoints = sprints.length
    ? Math.round(sprints.reduce((s, sp) => s + sp.throughputByPoints, 0) / sprints.length)
    : 0;
  const avgCompletionPct    = sprints.length
    ? Math.round(sprints.reduce((s, sp) => s + sp.completionPct, 0) / sprints.length)
    : 0;
  const avgMidSprintPct     = sprints.length
    ? Math.round(sprints.reduce((s, sp) => s + sp.midSprintPct, 0) / sprints.length)
    : 0;

  const best  = sprints.reduce((a, b) => a.throughputByCount >= b.throughputByCount ? a : b, sprints[0]);
  const worst = sprints.reduce((a, b) => a.throughputByCount <= b.throughputByCount ? a : b, sprints[0]);

  const overallConfidence = sprints.length
    ? Math.round(sprints.reduce((s, sp) => s + sp.deliveryConfidence, 0) / sprints.length)
    : 0;

  return {
    sprints,
    totalSprints:     sprints.length,
    totalCommitted:   sprints.reduce((s, sp) => s + sp.committedCount, 0),
    totalCompleted:   sprints.reduce((s, sp) => s + sp.completedCount, 0),
    averageThroughputCount:  avgThroughputCount,
    averageThroughputPoints: avgThroughputPoints,
    averageCompletionPct:    avgCompletionPct,
    averageMidSprintPct:     avgMidSprintPct,
    deliveryTrendValue:      trend.value,
    trendDirection:          trend.direction,
    bestSprintName:          best?.sprintName ?? '',
    worstSprintName:         worst?.sprintName ?? '',
    endLoadedSprintCount:    sprints.filter(s => s.deliveryPattern === 'End-Loaded Sprint').length,
    blockedSprintCount:      sprints.filter(s => s.deliveryPattern === 'Blocked Sprint').length,
    overallDeliveryConfidence: overallConfidence,
  };
}

function emptySummary(): SprintThroughputSummary {
  return {
    sprints: [],
    totalSprints: 0,
    totalCommitted: 0,
    totalCompleted: 0,
    averageThroughputCount: 0,
    averageThroughputPoints: 0,
    averageCompletionPct: 0,
    averageMidSprintPct: 0,
    deliveryTrendValue: 0,
    trendDirection: 'Stable',
    bestSprintName: '',
    worstSprintName: '',
    endLoadedSprintCount: 0,
    blockedSprintCount: 0,
    overallDeliveryConfidence: 0,
  };
}
