// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Missing-column impact service — goes beyond the data quality score.
// For each missing or incomplete field it tells the user EXACTLY what they
// are seeing wrong in their dashboard right now and what they would gain
// by fixing the export.
//
// Distinct from 9.1 (DataQuality score) which gives a numeric overview.
// This service gives a field-by-field contextual impact explanation.

import type { FieldImpact, FieldImpactReport, CheckSeverity } from '@/types/dataQuality';

type JiraIssue = Record<string, unknown>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const DONE_ST = new Set(['done', 'closed', 'resolved']);
function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }
function isDone(i: JiraIssue): boolean { return DONE_ST.has(norm(i['Status'])); }
function has(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '0';
}

// Is the column completely absent from the export (not a single non-empty value)?
function isColumnAbsent(issues: JiraIssue[], field: string): boolean {
  return issues.every(i => !has(i[field]));
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n !== 1 ? 's' : ''}`;
}

// ── Individual field impact builders ──────────────────────────────────────────

function inProgressDateImpact(issues: JiraIssue[]): FieldImpact | null {
  const done        = issues.filter(isDone);
  const missing     = done.filter(i => !has(i['In Progress Date']) && !has(i['Sprint Start']));
  const withFallback= done.filter(i => !has(i['In Progress Date']) && has(i['Sprint Start']));
  if (missing.length === 0 && withFallback.length === 0) return null;

  const absent = isColumnAbsent(issues, 'In Progress Date');

  return {
    field:           'In Progress Date',
    label:           'In Progress Date',
    isColumnAbsent:  absent,
    missingCount:    missing.length + withFallback.length,
    totalApplicable: done.length,
    missingPct:      pct(missing.length + withFallback.length, done.length),
    severity:        'high' as CheckSeverity,
    whatYouSeeNow:   absent
      ? `Cycle Time shows 0d for all ${done.length} completed items because the "In Progress Date" column is not in the export.`
      : `Cycle Time is approximated for ${plural(missing.length + withFallback.length, 'completed item')} (${pct(missing.length + withFallback.length, done.length)}% of done items) due to missing In Progress Date.`,
    whatYoullGain:   `Accurate Cycle Time and Flow Efficiency for all ${done.length} completed items. Mid-sprint delivery patterns will be more reliable.`,
    dashboardLocations: ['Full Report → Key Metrics → Cycle Time card', 'Full Report → Flow Health panel', 'Full Report → Throughput → Mid-Sprint Delivery'],
    fallbackUsed:    withFallback.length > 0
      ? `Sprint Start Date used as fallback for ${plural(withFallback.length, 'item')}.`
      : null,
    suggestedFix:    'In Jira, add the "In Progress Date" column to your CSV export. In board settings, enable date tracking for In Progress transitions.',
  };
}

function doneDateImpact(issues: JiraIssue[]): FieldImpact | null {
  const done        = issues.filter(isDone);
  const missing     = done.filter(i => !has(i['Done Date']) && !has(i['Resolution Date']));
  if (missing.length === 0) return null;

  const absent = isColumnAbsent(issues, 'Done Date') && isColumnAbsent(issues, 'Resolution Date');

  return {
    field:           'Done Date',
    label:           'Done Date / Resolution Date',
    isColumnAbsent:  absent,
    missingCount:    missing.length,
    totalApplicable: done.length,
    missingPct:      pct(missing.length, done.length),
    severity:        'critical' as CheckSeverity,
    whatYouSeeNow:   absent
      ? `Lead Time shows 0d for all ${done.length} completed items. Sprint throughput dates cannot be verified.`
      : `Lead Time is unavailable for ${plural(missing.length, 'completed item')} (${pct(missing.length, done.length)}% of done items).`,
    whatYoullGain:   `Accurate Lead Time, Sprint Throughput calculated from sprint dates, and Release Readiness for all ${done.length} completed items.`,
    dashboardLocations: ['Full Report → Key Metrics → Lead Time card', 'Full Report → Throughput → Sprint Throughput', 'Excel → Cycle & Lead Time sheet (P85 percentile)'],
    fallbackUsed:    null,
    suggestedFix:    'Include "Done Date" or "Resolution Date" in your Jira export. In Jira: Columns → add Resolution Date.',
  };
}

function storyPointsImpact(issues: JiraIssue[]): FieldImpact | null {
  const missing = issues.filter(i => !has(i['Story Points']) || Number(i['Story Points']) === 0);
  if (missing.length === 0) return null;

  const absent = isColumnAbsent(issues, 'Story Points');

  return {
    field:           'Story Points',
    label:           'Story Points',
    isColumnAbsent:  absent,
    missingCount:    missing.length,
    totalApplicable: issues.length,
    missingPct:      pct(missing.length, issues.length),
    severity:        'high' as CheckSeverity,
    whatYouSeeNow:   absent
      ? 'Story Points KPI shows 0. Velocity is issue-count only. Sprint story point charts are empty.'
      : `Story Points KPI undercounts effort — ${plural(missing.length, 'item')} (${pct(missing.length, issues.length)}%) have no story points estimated.`,
    whatYoullGain:   'Sprint velocity in story points, accurate commitment accuracy, Story Points Completion % chart, and story-point-based forecasting.',
    dashboardLocations: ['Full Report → Key Metrics → Story Points card', 'Charts → Sprint Velocity (story points)', 'Full Report → Throughput → Sprint Throughput (SP columns)', 'Excel → Story Points Analysis sheet'],
    fallbackUsed:    null,
    suggestedFix:    'Estimate all backlog items in Jira with story points. In Jira: open each issue → set Story Points field. Then re-export.',
  };
}

function sprintImpact(issues: JiraIssue[]): FieldImpact | null {
  const missing = issues.filter(i => !has(i['Sprint']) && !has(i['Actual Sprint']));
  if (missing.length === 0) return null;

  const absent = isColumnAbsent(issues, 'Sprint') && isColumnAbsent(issues, 'Actual Sprint');
  const sprints = new Set(issues.filter(i => has(i['Sprint'])).map(i => String(i['Sprint'])));

  return {
    field:           'Sprint',
    label:           'Sprint',
    isColumnAbsent:  absent,
    missingCount:    missing.length,
    totalApplicable: issues.length,
    missingPct:      pct(missing.length, issues.length),
    severity:        'high' as CheckSeverity,
    whatYouSeeNow:   absent
      ? 'Sprint Throughput, Mid-Sprint Delivery, and Sprint Comparison panels show no data. All items are treated as Kanban flow.'
      : `${plural(missing.length, 'item')} (${pct(missing.length, issues.length)}%) are not assigned to a sprint. They appear only in Kanban flow, not sprint analytics.`,
    whatYoullGain:   sprints.size > 0
      ? `Sprint-by-sprint throughput for ${sprints.size} detected sprint${sprints.size !== 1 ? 's' : ''}, mid-sprint delivery patterns, and sprint comparison.`
      : 'Full sprint analytics: throughput, mid-sprint patterns, goal outcomes, sprint comparison, and sprint velocity chart.',
    dashboardLocations: ['Full Report → Throughput → Sprint Throughput panel', 'Full Report → Throughput → Mid-Sprint Delivery', 'Full Report → Throughput → Sprint Comparison', 'Charts → Sprint Velocity'],
    fallbackUsed:    null,
    suggestedFix:    'Add the "Sprint" column to your Jira export. In Jira: Columns → check Sprint (or Active Sprint).',
  };
}

function epicLinkImpact(issues: JiraIssue[]): FieldImpact | null {
  const nonEpics = issues.filter(i => norm(i['Issue Type']) !== 'epic');
  const missing  = nonEpics.filter(i => !has(i['Epic Link']) && !has(i['Parent Key']));
  if (missing.length === 0) return null;

  const absent = isColumnAbsent(issues, 'Epic Link') && isColumnAbsent(issues, 'Parent Key');

  return {
    field:           'Epic Link',
    label:           'Epic Link / Parent Key',
    isColumnAbsent:  absent,
    missingCount:    missing.length,
    totalApplicable: nonEpics.length,
    missingPct:      pct(missing.length, nonEpics.length),
    severity:        'high' as CheckSeverity,
    whatYouSeeNow:   absent
      ? `Work Item Explorer cannot show hierarchy. ${plural(missing.length, 'item')} appear as orphans and are invisible in Epic Readiness.`
      : `${plural(missing.length, 'item')} (${pct(missing.length, nonEpics.length)}% of non-epic items) have no Epic or Parent link — they appear as orphans.`,
    whatYoullGain:   'Full hierarchy in Work Item Explorer, accurate Epic progress bars, reduced orphan count, and reliable delivery structure map.',
    dashboardLocations: ['Work Item Explorer (/explore) — hierarchy graph', 'Full Report → Readiness → Top At-Risk Epics', 'Full Report → Data Quality card → Orphan count', 'Excel → Orphan & Data Quality sheet'],
    fallbackUsed:    null,
    suggestedFix:    'Add "Epic Link" column to your Jira export. In Jira: Columns → Epic Link. Ensure all Stories are linked to an Epic.',
  };
}

function createdDateImpact(issues: JiraIssue[]): FieldImpact | null {
  const missing = issues.filter(i => !has(i['Created Date']));
  if (missing.length === 0) return null;

  const absent = isColumnAbsent(issues, 'Created Date');

  return {
    field:           'Created Date',
    label:           'Created Date',
    isColumnAbsent:  absent,
    missingCount:    missing.length,
    totalApplicable: issues.length,
    missingPct:      pct(missing.length, issues.length),
    severity:        'high' as CheckSeverity,
    whatYouSeeNow:   absent
      ? 'Lead Time shows 0d for all items (no start reference). Issue age cannot be calculated.'
      : `Lead Time is unavailable for ${plural(missing.length, 'item')}. Issue age shows 0 for ${pct(missing.length, issues.length)}% of items.`,
    whatYoullGain:   'Accurate Lead Time for all items, correct issue age, and reliable aging WIP detection.',
    dashboardLocations: ['Full Report → Key Metrics → Lead Time card', 'Full Report → Flow Health → Open Age column', 'Excel → Cycle & Lead Time sheet'],
    fallbackUsed:    null,
    suggestedFix:    'Include "Created Date" in your Jira export. In Jira: Columns → Created.',
  };
}

function sprintDateImpact(issues: JiraIssue[]): FieldImpact | null {
  const sprintItems = issues.filter(i => has(i['Sprint']) || has(i['Actual Sprint']));
  if (sprintItems.length === 0) return null;

  const missing = sprintItems.filter(i => !has(i['Sprint Start']) && !has(i['Sprint End']));
  if (missing.length === 0) return null;

  const absent = isColumnAbsent(issues, 'Sprint Start');

  return {
    field:           'Sprint Start',
    label:           'Sprint Start / Sprint End dates',
    isColumnAbsent:  absent,
    missingCount:    missing.length,
    totalApplicable: sprintItems.length,
    missingPct:      pct(missing.length, sprintItems.length),
    severity:        'medium' as CheckSeverity,
    whatYouSeeNow:   absent
      ? 'Mid-Sprint Delivery panel shows "—" for all sprints. Sprint patterns (End-Loaded, Healthy) cannot be detected.'
      : `Mid-sprint patterns unavailable for ${plural(missing.length, 'sprint item')}. Sprint dates inferred from issue created/done dates.`,
    whatYoullGain:   'Mid-sprint delivery pattern detection (End-Loaded, Scope Instability, Healthy Early Progress) for every sprint. Sprint Comparison shows goal outcomes.',
    dashboardLocations: ['Full Report → Throughput → Mid-Sprint Delivery', 'Full Report → Throughput → Sprint Comparison (goal outcome column)', 'Full Report → Throughput → Sprint Throughput (mid-sprint %)'],
    fallbackUsed:    'Created Date and Done Date used to infer sprint boundaries.',
    suggestedFix:    'Add "Sprint Start" and "Sprint End" columns to your Jira export. In Jira: Columns → Sprint Start Date, Sprint End Date.',
  };
}

function assigneeImpact(issues: JiraIssue[]): FieldImpact | null {
  const missing = issues.filter(i => !has(i['Assignee']) || norm(i['Assignee']) === 'unassigned');
  if (missing.length === 0) return null;

  const absent = isColumnAbsent(issues, 'Assignee');

  return {
    field:           'Assignee',
    label:           'Assignee',
    isColumnAbsent:  absent,
    missingCount:    missing.length,
    totalApplicable: issues.length,
    missingPct:      pct(missing.length, issues.length),
    severity:        'medium' as CheckSeverity,
    whatYouSeeNow:   absent
      ? 'Team Capacity chart is empty. All items appear under "Unassigned".'
      : `${plural(missing.length, 'item')} (${pct(missing.length, issues.length)}%) appear under "Unassigned" in Team Capacity. Workload distribution is skewed.`,
    whatYoullGain:   'Accurate Team Capacity chart, per-assignee workload, accountability tracking, and reliable assignee workload in Excel export.',
    dashboardLocations: ['Full Report → Delivery Detail → Ownership & Capacity', 'Charts → Team Load bars', 'Excel → Team Performance sheet', 'Excel → Assignee Workload sheet'],
    fallbackUsed:    null,
    suggestedFix:    'Assign all active items to team members in Jira. In Jira: open each unassigned issue → Assign to a team member.',
  };
}

function fixVersionImpact(issues: JiraIssue[]): FieldImpact | null {
  const missing = issues.filter(i => !has(i['Fix Version/s']));
  if (missing.length === 0) return null;

  const absent = isColumnAbsent(issues, 'Fix Version/s');

  return {
    field:           'Fix Version/s',
    label:           'Fix Version / Release',
    isColumnAbsent:  absent,
    missingCount:    missing.length,
    totalApplicable: issues.length,
    missingPct:      pct(missing.length, issues.length),
    severity:        'low' as CheckSeverity,
    whatYouSeeNow:   absent
      ? 'Release Readiness section shows no release data. Excel Release Readiness sheet is empty.'
      : `Release Readiness only covers ${issues.length - missing.length} of ${issues.length} items. ${plural(missing.length, 'item')} have no release version.`,
    whatYoullGain:   'Release Readiness Go/Conditional Go/No-Go assessment per release. Release confidence tracking in Excel export.',
    dashboardLocations: ['Full Report → Readiness → Epic Health & Release Readiness', 'Excel → Release Readiness sheet'],
    fallbackUsed:    null,
    suggestedFix:    'Add "Fix Version/s" column to your Jira export. In Jira: Columns → Fix Version.',
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculateFieldImpacts(issues: JiraIssue[]): FieldImpactReport {
  if (!issues.length) {
    return { hasIssues: false, critical: [], high: [], medium: [], low: [], all: [], topSummary: 'No issues found.' };
  }

  const builders = [
    doneDateImpact,
    inProgressDateImpact,
    storyPointsImpact,
    sprintImpact,
    epicLinkImpact,
    createdDateImpact,
    sprintDateImpact,
    assigneeImpact,
    fixVersionImpact,
  ];

  const all = builders
    .map(b => b(issues))
    .filter((x): x is FieldImpact => x !== null)
    .sort((a, b) => {
      const order: Record<CheckSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity] || b.missingPct - a.missingPct;
    });

  const critical = all.filter(i => i.severity === 'critical');
  const high     = all.filter(i => i.severity === 'high');
  const medium   = all.filter(i => i.severity === 'medium');
  const low      = all.filter(i => i.severity === 'low');

  const topSummary = buildTopSummary(all, issues.length);

  return { hasIssues: all.length > 0, critical, high, medium, low, all, topSummary };
}

function buildTopSummary(impacts: FieldImpact[], total: number): string {
  if (impacts.length === 0) return `All important columns are present in this export of ${total} issues. Metrics are fully reliable.`;

  const critCount   = impacts.filter(i => i.severity === 'critical').length;
  const absentCols  = impacts.filter(i => i.isColumnAbsent).map(i => i.label);
  const topImpact   = impacts[0];

  let summary = '';

  if (absentCols.length > 0) {
    summary += `${absentCols.length} column${absentCols.length > 1 ? 's are' : ' is'} completely absent from your export: ${absentCols.slice(0, 2).join(', ')}${absentCols.length > 2 ? ` and ${absentCols.length - 2} more` : ''}. `;
  }

  if (critCount > 0) {
    summary += `${critCount} critical impact${critCount > 1 ? 's' : ''} detected. `;
  }

  if (topImpact) {
    summary += topImpact.whatYouSeeNow;
  }

  return summary.trim();
}
