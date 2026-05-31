// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Metric Confidence Score — calculates how trustworthy each KPI is
// based on the completeness of the Jira data fields it depends on.
//
// Confidence = ratio of issues that have ALL required fields for the metric.
// Band: High ≥80%, Medium ≥60%, Low ≥40%, Unreliable <40%, N/A = no data.

import type { ConfidenceBand, MetricConfidence, MetricConfidenceMap } from '@/types/metricConfidence';

type JiraIssue = Record<string, unknown>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const DONE_ST = new Set(['done', 'closed', 'resolved']);
function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }
function isDone(i: JiraIssue): boolean { return DONE_ST.has(norm(i['Status'])); }
function has(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '0';
}
function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}
function band(score: number, sampleSize: number): ConfidenceBand {
  if (sampleSize === 0) return 'N/A';
  if (score >= 80)      return 'High';
  if (score >= 60)      return 'Medium';
  if (score >= 40)      return 'Low';
  return 'Unreliable';
}

function make(
  key: string, label: string, score: number, sampleSize: number,
  reason: string, required: string[], missing: string[],
): MetricConfidence {
  return {
    metricKey:      key,
    metricLabel:    label,
    confidence:     Math.max(0, Math.min(100, score)),
    band:           band(score, sampleSize),
    reason,
    sampleSize,
    requiredFields: required,
    missingFields:  missing,
  };
}

// ── Individual metric confidence calculators ───────────────────────────────────

function leadTimeConf(issues: JiraIssue[]): MetricConfidence {
  const done      = issues.filter(isDone);
  const withBoth  = done.filter(i => has(i['Created Date']) && (has(i['Done Date']) || has(i['Resolution Date'])));
  const score     = pct(withBoth.length, done.length);
  const missing: string[] = [];
  if (done.filter(i => !has(i['Created Date'])).length > 0) missing.push('Created Date');
  if (done.filter(i => !has(i['Done Date']) && !has(i['Resolution Date'])).length > 0) missing.push('Done Date');

  const reason = done.length === 0
    ? 'No completed items — lead time cannot be calculated.'
    : score === 100
    ? `All ${done.length} completed items have Created Date and Done Date.`
    : `${withBoth.length} of ${done.length} completed items have both Created Date and Done Date. ${missing.join(', ')} missing for remaining items.`;

  return make('leadTime', 'Lead Time', score, done.length, reason, ['Created Date', 'Done Date'], missing);
}

function cycleTimeConf(issues: JiraIssue[]): MetricConfidence {
  const done      = issues.filter(isDone);
  const withStart = done.filter(i => has(i['In Progress Date']) || has(i['Sprint Start']));
  const score     = pct(withStart.length, done.length);
  const missing   = withStart.length < done.length ? ['In Progress Date'] : [];

  const reason = done.length === 0
    ? 'No completed items — cycle time cannot be calculated.'
    : score === 100
    ? `All ${done.length} completed items have an In Progress Date.`
    : `${withStart.length} of ${done.length} completed items have In Progress Date. Cycle time for the rest is approximated.`;

  return make('cycleTime', 'Cycle Time', score, done.length, reason, ['In Progress Date', 'Done Date'], missing);
}

function sprintThroughputConf(issues: JiraIssue[]): MetricConfidence {
  const withSprint = issues.filter(i => has(i['Sprint']) || has(i['Actual Sprint']));
  const sprintPct  = pct(withSprint.length, issues.length);
  const withDates  = withSprint.filter(i => (has(i['Sprint Start']) && has(i['Sprint End'])));
  const datesPct   = pct(withDates.length, withSprint.length);
  // weighted: sprint field 60%, sprint dates 40%
  const score  = Math.round(sprintPct * 0.6 + datesPct * 0.4);
  const missing: string[] = [];
  if (sprintPct < 100)  missing.push('Sprint');
  if (datesPct  < 100)  missing.push('Sprint Start / Sprint End');

  const reason = withSprint.length === 0
    ? 'No Sprint field found. Sprint throughput cannot be calculated.'
    : datesPct < 50
    ? `${withSprint.length} items have Sprint field but only ${withDates.length} have Sprint Start/End dates. Mid-sprint analytics are limited.`
    : `${withSprint.length} of ${issues.length} items assigned to sprints. ${withDates.length} have full sprint dates.`;

  return make('sprintThroughput', 'Sprint Throughput', score, withSprint.length, reason,
    ['Sprint', 'Sprint Start', 'Sprint End'], missing);
}

function velocityConf(issues: JiraIssue[]): MetricConfidence {
  const withSP     = issues.filter(i => has(i['Story Points']) && Number(i['Story Points']) > 0);
  const withSprint = issues.filter(i => has(i['Sprint']) || has(i['Actual Sprint']));
  const spScore    = pct(withSP.length, issues.length);
  const stScore    = pct(withSprint.length, issues.length);
  const score      = Math.round(spScore * 0.6 + stScore * 0.4);
  const missing: string[] = [];
  if (spScore < 100) missing.push('Story Points');
  if (stScore < 100) missing.push('Sprint');

  const reason = withSP.length === 0
    ? 'No Story Points found. Velocity is based on issue count only, not effort.'
    : score === 100
    ? `All items have Story Points and Sprint fields. Velocity is highly reliable.`
    : `${withSP.length} of ${issues.length} items have Story Points. Velocity may undercount actual team effort.`;

  return make('velocity', 'Velocity', score, issues.length, reason, ['Story Points', 'Sprint'], missing);
}

function storyPointsConf(issues: JiraIssue[]): MetricConfidence {
  const withSP = issues.filter(i => has(i['Story Points']) && Number(i['Story Points']) > 0);
  const score  = pct(withSP.length, issues.length);
  const missing = withSP.length < issues.length ? ['Story Points'] : [];

  const reason = withSP.length === 0
    ? 'No Story Points found. Story point metrics are unavailable.'
    : score === 100
    ? `All ${issues.length} items have Story Points estimated.`
    : `${withSP.length} of ${issues.length} items have Story Points. ${issues.length - withSP.length} items are unestimated.`;

  return make('storyPoints', 'Story Points', score, issues.length, reason, ['Story Points'], missing);
}

function kanbanFlowConf(issues: JiraIssue[]): MetricConfidence {
  const noSprint = issues.filter(i => !has(i['Sprint']) && !has(i['Actual Sprint']));
  const done     = noSprint.filter(isDone);
  const withDate = done.filter(i => has(i['Done Date']) || has(i['Resolution Date']));
  const score    = pct(withDate.length, done.length);
  const missing  = withDate.length < done.length ? ['Done Date'] : [];

  const reason = done.length === 0
    ? 'No completed non-sprint items found. Kanban flow metrics are unavailable.'
    : `${withDate.length} of ${done.length} completed Kanban items have Done Date.`;

  return make('kanbanFlow', 'Kanban Flow', score, done.length, reason, ['Done Date'], missing);
}

function orphanRiskConf(issues: JiraIssue[]): MetricConfidence {
  const nonEpics   = issues.filter(i => norm(i['Issue Type']) !== 'epic');
  const withLink   = nonEpics.filter(i => has(i['Epic Link']) || has(i['Parent Key']));
  // Even items without links are valid data — confidence is about whether the FIELDS exist in export
  // We treat it as: what % of non-epics have at least one hierarchy field available
  const score      = pct(withLink.length + 1, nonEpics.length + 1); // +1 to avoid div/0 edge
  const orphans    = nonEpics.filter(i => !has(i['Epic Link']) && !has(i['Parent Key'])).length;
  const missing    = orphans > 0 ? ['Epic Link / Parent Key'] : [];

  const reason = nonEpics.length === 0
    ? 'No non-epic items found.'
    : orphans === 0
    ? 'All non-epic items are linked to an Epic or Parent. Orphan risk detection is reliable.'
    : `${orphans} of ${nonEpics.length} non-epic items have no Epic Link or Parent Key. Orphan count may be understated if columns are absent from export.`;

  return make('orphanRisk', 'Orphan Risk', score, nonEpics.length, reason, ['Epic Link', 'Parent Key'], missing);
}

function midSprintConf(issues: JiraIssue[]): MetricConfidence {
  const sprintItems = issues.filter(i => has(i['Sprint']) || has(i['Actual Sprint']));
  const withDates   = sprintItems.filter(i => has(i['Sprint Start']) && has(i['Sprint End']));
  const score       = pct(withDates.length, sprintItems.length);
  const missing     = withDates.length < sprintItems.length ? ['Sprint Start', 'Sprint End'] : [];

  const reason = sprintItems.length === 0
    ? 'No sprint items found. Mid-sprint analytics unavailable.'
    : score === 100
    ? `All sprint items have Sprint Start and End dates. Mid-sprint patterns are reliable.`
    : `${withDates.length} of ${sprintItems.length} sprint items have Sprint Start/End. Mid-sprint % uses inferred dates for the rest.`;

  return make('midSprint', 'Mid-Sprint Delivery', score, sprintItems.length, reason,
    ['Sprint', 'Sprint Start', 'Sprint End'], missing);
}

function teamCapacityConf(issues: JiraIssue[]): MetricConfidence {
  const withAssignee = issues.filter(i => has(i['Assignee']) && norm(i['Assignee']) !== 'unassigned');
  const score        = pct(withAssignee.length, issues.length);
  const missing      = withAssignee.length < issues.length ? ['Assignee'] : [];

  const reason = score === 100
    ? 'All items have an assignee. Team workload distribution is reliable.'
    : `${issues.length - withAssignee.length} items are unassigned. Team capacity chart may not reflect actual workload.`;

  return make('teamCapacity', 'Team Capacity', score, issues.length, reason, ['Assignee'], missing);
}

function releaseReadinessConf(issues: JiraIssue[]): MetricConfidence {
  const withVersion = issues.filter(i => has(i['Fix Version/s']));
  const score       = pct(withVersion.length, issues.length);
  const missing     = withVersion.length < issues.length ? ['Fix Version/s'] : [];

  const reason = withVersion.length === 0
    ? 'No Fix Version found. Release readiness cannot be calculated.'
    : score === 100
    ? 'All items have a Fix Version. Release readiness is fully calculable.'
    : `${withVersion.length} of ${issues.length} items have a Fix Version. Release readiness covers only versioned items.`;

  return make('releaseReadiness', 'Release Readiness', score, issues.length, reason, ['Fix Version/s'], missing);
}

function healthScoreConf(map: Omit<MetricConfidenceMap, 'healthScore'>): MetricConfidence {
  // Health score composite: lead(25%) + cycle(20%) + sprint(15%) + storyPoints(20%) + orphan(20%)
  const composite = Math.round(
    map.leadTime.confidence         * 0.25 +
    map.cycleTime.confidence        * 0.20 +
    map.sprintThroughput.confidence * 0.15 +
    map.storyPoints.confidence      * 0.20 +
    map.orphanRisk.confidence       * 0.20,
  );

  const lowConf  = Object.values(map).filter(m => m.band === 'Low' || m.band === 'Unreliable' || m.band === 'N/A');
  const reason   = lowConf.length === 0
    ? 'All underlying metrics have high confidence. Health Score is reliable.'
    : `Health Score confidence is reduced because: ${lowConf.map(m => m.metricLabel).join(', ')} have limited data.`;

  const allIssues = map.leadTime.sampleSize; // proxy
  return make('healthScore', 'Health Score', composite, allIssues, reason, [], []);
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculateMetricConfidence(issues: JiraIssue[]): MetricConfidenceMap {
  const partial = {
    leadTime:         leadTimeConf(issues),
    cycleTime:        cycleTimeConf(issues),
    sprintThroughput: sprintThroughputConf(issues),
    velocity:         velocityConf(issues),
    storyPoints:      storyPointsConf(issues),
    kanbanFlow:       kanbanFlowConf(issues),
    orphanRisk:       orphanRiskConf(issues),
    midSprint:        midSprintConf(issues),
    teamCapacity:     teamCapacityConf(issues),
    releaseReadiness: releaseReadinessConf(issues),
  };

  return {
    ...partial,
    healthScore: healthScoreConf(partial),
  };
}
