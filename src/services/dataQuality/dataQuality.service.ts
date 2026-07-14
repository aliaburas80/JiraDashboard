// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Data Quality Score — calculates how complete and trustworthy an uploaded
// Jira export is. Score drives the DataQualityCard and upload warning panel.
//
// Algorithm:
//   1. For each quality check, compute missingPct = missing / applicable × 100
//   2. Deduct (weight × missingPct / 100) from a starting score of 100
//   3. Apply orphan penalty: up to 10 pts based on orphan ratio
//   4. Clamp result to 0–100 and classify into band

import type { DataQualityCheck, DataQualityResult, DataQualityBand } from '@/types/dataQuality';
import type { OrphanRules } from '@/types/orphanRules';
import { DEFAULT_ORPHAN_RULES } from '@/types/orphanRules';
import { isOrphanByRules } from '@/services/settings/orphanRules.service';

type JiraIssue = Record<string, unknown>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const DONE_STATUSES = new Set(['done', 'closed', 'resolved']);

function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }
function isDone(issue: JiraIssue): boolean { return DONE_STATUSES.has(norm(issue['Status'])); }
function hasValue(v: unknown): boolean { return v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '0'; }

function missingPct(missing: number, total: number): number {
  return total === 0 ? 0 : Math.round((missing / total) * 100);
}

function band(score: number): DataQualityBand {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Weak';
  return 'Critical';
}

// ── Check definitions ─────────────────────────────────────────────────────────
// weight = contribution to score. All weights sum to 100.

const CHECK_DEFS = [
  {
    field:          'In Progress Date',
    label:          'Start Date (In Progress Date)',
    weight:         14,
    severity:       'high' as const,
    affectsMetrics: ['Cycle Time', 'Flow Efficiency', 'Mid-Sprint Delivery'],
    suggestedFix:   'Re-export Jira with the "In Progress Date" column included.',
    filter:         (issues: JiraIssue[]) => issues, // applicable to all
    isMissing:      (issue: JiraIssue) => !hasValue(issue['In Progress Date']) && !hasValue(issue['Sprint Start']),
  },
  {
    field:          'Done Date',
    label:          'Done Date (Resolution Date)',
    weight:         14,
    severity:       'critical' as const,
    affectsMetrics: ['Lead Time', 'Throughput', 'Sprint Completion', 'Release Readiness'],
    suggestedFix:   'Re-export Jira with the "Done Date" or "Resolution Date" column included.',
    filter:         (issues: JiraIssue[]) => issues.filter(isDone), // only done items need this
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Done Date']) && !hasValue(issue['Resolution Date']),
  },
  {
    field:          'Story Points',
    label:          'Story Points',
    weight:         12,
    severity:       'high' as const,
    affectsMetrics: ['Velocity', 'Story Point Completion', 'Sprint Commitment Accuracy'],
    suggestedFix:   'Estimate all active backlog items in story points and re-export.',
    filter:         (issues: JiraIssue[]) => issues,
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Story Points']) || Number(issue['Story Points']) === 0,
  },
  {
    field:          'Sprint',
    label:          'Sprint',
    weight:         12,
    severity:       'high' as const,
    affectsMetrics: ['Sprint Throughput', 'Mid-Sprint Delivery', 'Sprint Comparison'],
    suggestedFix:   'Include the Sprint column in your Jira export.',
    filter:         (issues: JiraIssue[]) => issues,
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Sprint']) && !hasValue(issue['Actual Sprint']),
  },
  {
    field:          'Epic Link',
    label:          'Epic Link',
    weight:         10,
    severity:       'high' as const,
    affectsMetrics: ['Epic Readiness', 'Work Item Explorer', 'Orphan Risk'],
    suggestedFix:   'Add the "Epic Link" column to your Jira export.',
    filter:         (issues: JiraIssue[]) => issues.filter(i => norm(i['Issue Type']) !== 'epic'),
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Epic Link']) && !hasValue(issue['Parent Key']),
  },
  {
    field:          'Created Date',
    label:          'Created Date',
    weight:         10,
    severity:       'high' as const,
    affectsMetrics: ['Lead Time', 'Issue Age', 'Orphan Detection'],
    suggestedFix:   'Include the "Created Date" column in your Jira export.',
    filter:         (issues: JiraIssue[]) => issues,
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Created Date']),
  },
  {
    field:          'Assignee',
    label:          'Assignee',
    weight:         9,
    severity:       'medium' as const,
    affectsMetrics: ['Team Capacity', 'Assignee Workload', 'Accountability Tracking'],
    suggestedFix:   'Assign all active items to team members in Jira.',
    filter:         (issues: JiraIssue[]) => issues,
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Assignee']) || norm(issue['Assignee']) === 'unassigned',
  },
  {
    field:          'Sprint Start',
    label:          'Sprint Start Date',
    weight:         9,
    severity:       'medium' as const,
    affectsMetrics: ['Mid-Sprint Delivery', 'Sprint Comparison', 'Sprint Velocity Chart'],
    suggestedFix:   'Include "Sprint Start" and "Sprint End" columns in your Jira export for mid-sprint analytics.',
    filter:         (issues: JiraIssue[]) => issues.filter(i => hasValue(i['Sprint']) || hasValue(i['Actual Sprint'])),
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Sprint Start']) && !hasValue(issue['Sprint End']),
  },
  {
    field:          'Fix Version/s',
    label:          'Fix Version / Release',
    weight:         6,
    severity:       'low' as const,
    affectsMetrics: ['Release Readiness', 'Release Confidence'],
    suggestedFix:   'Add the "Fix Version/s" column to your Jira export.',
    filter:         (issues: JiraIssue[]) => issues,
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Fix Version/s']),
  },
  {
    field:          'Priority',
    label:          'Priority',
    weight:         4,
    severity:       'low' as const,
    affectsMetrics: ['Risk Signals', 'High-Priority Open Items'],
    suggestedFix:   'Include the "Priority" column in your Jira export.',
    filter:         (issues: JiraIssue[]) => issues,
    isMissing:      (issue: JiraIssue) => !hasValue(issue['Priority']),
  },
];

// ── Main service function ──────────────────────────────────────────────────────

export function calculateDataQuality(
  issues: JiraIssue[],
  orphanRules: OrphanRules = DEFAULT_ORPHAN_RULES,
): DataQualityResult {
  if (!issues.length) {
    return {
      score: 0, band: 'Critical', totalIssues: 0,
      checks: [], summary: 'No issues found in the uploaded file.',
      affectedMetrics: [], criticalCount: 0, highCount: 0,
    };
  }

  const total = issues.length;
  let score   = 100;
  const checks: DataQualityCheck[] = [];
  const allAffectedMetrics = new Set<string>();

  for (const def of CHECK_DEFS) {
    const applicable = def.filter(issues);
    const missing    = applicable.filter(def.isMissing).length;
    const pct        = missingPct(missing, applicable.length);
    const deduction  = (def.weight * pct) / 100;

    score -= deduction;

    if (missing > 0) {
      def.affectsMetrics.forEach(m => allAffectedMetrics.add(m));
    }

    checks.push({
      field:          def.field,
      label:          def.label,
      missing,
      total:          applicable.length,
      missingPct:     pct,
      weight:         def.weight,
      severity:       def.severity,
      affectsMetrics: def.affectsMetrics,
      suggestedFix:   def.suggestedFix,
    });
  }

  // Orphan penalty: up to 10 pts based on orphan ratio among non-epics.
  // CP3-014: uses the same canonical orphan definition as the health-score
  // calculation (isOrphanByRules), so this ratio agrees with orphan counts
  // shown elsewhere in the app instead of an independent hardcoded check.
  const nonEpics    = issues.filter(i => norm(i['Issue Type']) !== 'epic');
  const orphanCount = nonEpics.filter(i => isOrphanByRules(i, orphanRules)).length;
  const orphanRatio = nonEpics.length > 0 ? orphanCount / nonEpics.length : 0;
  score -= Math.round(orphanRatio * 10);

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const scoreBand  = band(finalScore);

  const criticalCount = checks.filter(c => c.severity === 'critical' && c.missing > 0).length;
  const highCount     = checks.filter(c => c.severity === 'high'     && c.missing > 0).length;

  const summary = buildSummary(finalScore, scoreBand, checks, total, orphanCount);

  return {
    score:           finalScore,
    band:            scoreBand,
    totalIssues:     total,
    checks:          checks.sort((a, b) => b.missingPct - a.missingPct || b.weight - a.weight),
    summary,
    affectedMetrics: [...allAffectedMetrics],
    criticalCount,
    highCount,
  };
}

// ── Summary builder ───────────────────────────────────────────────────────────

function buildSummary(
  score: number,
  scoreBand: DataQualityBand,
  checks: DataQualityCheck[],
  total: number,
  orphanCount: number,
): string {
  const bandDescriptions: Record<DataQualityBand, string> = {
    Excellent: 'Metrics are highly reliable.',
    Good:      'Metrics are mostly reliable.',
    Fair:      'Some metrics may be incomplete.',
    Weak:      'Several metrics are unreliable.',
    Critical:  'Most metrics cannot be trusted.',
  };

  const topIssues = checks
    .filter(c => c.missing > 0 && c.missingPct >= 10)
    .slice(0, 3)
    .map(c => `${c.missing} item${c.missing !== 1 ? 's' : ''} missing ${c.label}`);

  let summary = `Your file quality score is ${score}%. ${bandDescriptions[scoreBand]}`;

  if (topIssues.length > 0) {
    summary += ` Key issues: ${topIssues.join('; ')}.`;
  }

  if (orphanCount > 0) {
    summary += ` ${orphanCount} orphan item${orphanCount !== 1 ? 's have' : ' has'} no Epic or Parent link.`;
  }

  return summary;
}
