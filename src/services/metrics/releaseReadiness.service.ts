// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Release Readiness Service — calculates per-version Go/Conditional Go/No-Go
// assessment with an actionable checklist from Jira export data.

import type {
  ReleaseReadinessSummary,
  ReleaseReadinessResult,
  ReleaseChecklistItem,
  ReleaseVerdict,
} from '@/types/releaseReadiness';

type JiraIssue = Record<string, unknown>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const DONE_ST = new Set(['done', 'closed', 'resolved']);
function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }
function isDone(i: JiraIssue): boolean { return DONE_ST.has(norm(i['Status'])); }
function isBlocked(i: JiraIssue): boolean {
  return i['Blocked Flag'] === true || norm(i['Blocked Flag']) === 'true';
}
function isBug(i: JiraIssue): boolean {
  return ['bug', 'defect', 'error'].includes(norm(i['Issue Type'] ?? ''));
}
function isCritical(i: JiraIssue): boolean {
  return norm(i['health'] ?? '') === 'critical';
}
function getVersion(i: JiraIssue): string {
  return String(i['Fix Version/s'] ?? '').trim();
}

// ── Verdict logic ─────────────────────────────────────────────────────────────

function deriveVerdict(
  completionPct: number,
  blockers: number,
  openBugs: number,
  criticalItems: number,
  scope: number,
): { verdict: ReleaseVerdict; reason: string } {
  if (scope === 0) return { verdict: 'Insufficient Data', reason: 'No items found for this version.' };

  if (blockers > 0) {
    return {
      verdict: 'No-Go',
      reason: `${blockers} blocker${blockers > 1 ? 's' : ''} must be resolved before release.`,
    };
  }
  if (completionPct < 70) {
    return {
      verdict: 'No-Go',
      reason: `Completion is ${completionPct}% — below the 70% minimum for release.`,
    };
  }
  if (openBugs > 0 || criticalItems > 0) {
    const issues = [];
    if (openBugs > 0) issues.push(`${openBugs} open bug${openBugs > 1 ? 's' : ''}`);
    if (criticalItems > 0) issues.push(`${criticalItems} critical item${criticalItems > 1 ? 's' : ''}`);
    return {
      verdict: 'Conditional Go',
      reason: `${issues.join(' and ')} require review before release proceeds.`,
    };
  }
  if (completionPct < 90) {
    return {
      verdict: 'Conditional Go',
      reason: `Completion is ${completionPct}% — review remaining ${100 - completionPct}% before release.`,
    };
  }
  return {
    verdict: 'Go',
    reason: `All release criteria met. ${completionPct}% complete, no blockers, no open bugs.`,
  };
}

// ── Checklist builder ─────────────────────────────────────────────────────────

function buildChecklist(
  scope: number,
  completed: number,
  completionPct: number,
  blockers: number,
  openBugs: number,
  criticalItems: number,
  issues: JiraIssue[],
): ReleaseChecklistItem[] {
  const hasAssignees = issues.filter(i => {
    const a = norm(i['Assignee'] ?? '');
    return a && a !== 'unassigned';
  }).length;

  return [
    {
      id: 'scope',
      label: 'Release scope is defined',
      passed: scope > 0,
      detail: scope > 0 ? `${scope} items in scope` : 'No items found for this version.',
      blocking: true,
    },
    {
      id: 'completion',
      label: 'Completion ≥ 70%',
      passed: completionPct >= 70,
      detail: `${completionPct}% complete (${completed} of ${scope} items done)`,
      blocking: true,
    },
    {
      id: 'blockers',
      label: 'No blocked items',
      passed: blockers === 0,
      detail: blockers === 0 ? 'No blocked items' : `${blockers} blocked item${blockers > 1 ? 's' : ''} must be resolved`,
      blocking: true,
    },
    {
      id: 'bugs',
      label: 'No open bugs',
      passed: openBugs === 0,
      detail: openBugs === 0 ? 'No open bugs' : `${openBugs} open bug${openBugs > 1 ? 's' : ''} remain`,
      blocking: false,
    },
    {
      id: 'critical',
      label: 'No critical health items',
      passed: criticalItems === 0,
      detail: criticalItems === 0 ? 'No critical health items' : `${criticalItems} critical item${criticalItems > 1 ? 's' : ''} need attention`,
      blocking: false,
    },
    {
      id: 'full_completion',
      label: 'Completion ≥ 90% (ideal)',
      passed: completionPct >= 90,
      detail: completionPct >= 90 ? 'Exceeds 90% threshold' : `${100 - completionPct}% of scope remains`,
      blocking: false,
    },
    {
      id: 'assignees',
      label: 'All items assigned',
      passed: hasAssignees === scope,
      detail: hasAssignees === scope
        ? 'All items have an assignee'
        : `${scope - hasAssignees} unassigned item${scope - hasAssignees > 1 ? 's' : ''}`,
      blocking: false,
    },
  ];
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculateReleaseReadiness(issues: JiraIssue[]): ReleaseReadinessSummary {
  // Group by Fix Version
  const versionMap = new Map<string, JiraIssue[]>();
  issues.forEach(i => {
    const v = getVersion(i);
    if (!v) return;
    // Handle comma-separated versions (e.g. "v1.0, v1.1")
    v.split(',').map(s => s.trim()).filter(Boolean).forEach(ver => {
      if (!versionMap.has(ver)) versionMap.set(ver, []);
      versionMap.get(ver)!.push(i);
    });
  });

  if (versionMap.size === 0) {
    return { releases: [], hasVersionData: false, totalVersions: 0,
      goCount: 0, conditionalCount: 0, noGoCount: 0 };
  }

  const releases: ReleaseReadinessResult[] = [];

  for (const [version, items] of versionMap.entries()) {
    const scope       = items.length;
    const completed   = items.filter(isDone).length;
    const open        = scope - completed;
    const blockers    = items.filter(i => !isDone(i) && isBlocked(i)).length;
    const openBugs    = items.filter(i => !isDone(i) && isBug(i)).length;
    const criticalItems = items.filter(i => !isDone(i) && isCritical(i)).length;
    const completionPct = scope > 0 ? Math.round((completed / scope) * 100) : 0;

    const { verdict, reason } = deriveVerdict(completionPct, blockers, openBugs, criticalItems, scope);
    const checklist = buildChecklist(scope, completed, completionPct, blockers, openBugs, criticalItems, items);

    const issueList = items.slice(0, 20).map(i => ({
      key:     String(i['Issue Key']  ?? ''),
      summary: String(i['Summary']    ?? ''),
      status:  String(i['Status']     ?? 'Unknown'),
      type:    String(i['Issue Type'] ?? ''),
      health:  String(i['health']     ?? 'good'),
    }));

    releases.push({ version, scope, completed, open, blockers, openBugs, criticalItems,
      completionPct, verdict, verdictReason: reason, checklist, issues: issueList });
  }

  // Sort: No-Go first, then Conditional Go, then Go, then Insufficient
  const order: Record<string, number> = { 'No-Go': 0, 'Conditional Go': 1, 'Go': 2, 'Insufficient Data': 3 };
  releases.sort((a, b) => (order[a.verdict] ?? 9) - (order[b.verdict] ?? 9));

  return {
    releases,
    hasVersionData: true,
    totalVersions:  releases.length,
    goCount:        releases.filter(r => r.verdict === 'Go').length,
    conditionalCount: releases.filter(r => r.verdict === 'Conditional Go').length,
    noGoCount:      releases.filter(r => r.verdict === 'No-Go').length,
  };
}
