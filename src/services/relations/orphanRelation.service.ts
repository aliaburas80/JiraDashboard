// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Orphan risk detection service.
// Classifies every issue that has no resolvable parent/epic link.
// Orphans are treated as delivery risks, not just missing data.

type JiraIssue = Record<string, unknown>;

export type OrphanClassification =
  | 'MISSING_EPIC'      // Story/Task with no Epic Link
  | 'MISSING_PARENT'    // Sub-task/Bug with no Parent Key
  | 'FULLY_ORPHANED'    // No links resolvable from any signal
  | 'DANGLING_LINK';    // Has an Epic/Parent key that doesn't exist in the dataset

export interface OrphanReport {
  key: string;
  summary: string;
  type: string;
  status: string;
  assignee: string;
  classification: OrphanClassification;
  deliveryImpact: string;
  suggestedFix: string;
}

function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }

const STORY_LEVEL  = new Set(['story', 'user story', 'feature', 'task', 'improvement', 'spike', 'technical debt', 'change request']);
const CHILD_LEVEL  = new Set(['sub-task', 'subtask', 'bug', 'defect']);

export function detectOrphans(
  issues: JiraIssue[],
  orphanKeys: Set<string>,
): OrphanReport[] {
  // Support both FlowItem (key, type, epic, parent) and raw JiraIssue (Issue Key, etc.)
  const getIssueKey = (i: JiraIssue) => String(i['Issue Key'] ?? i['key'] ?? i['issueKey'] ?? '').trim();
  const keySet = new Set(issues.map(getIssueKey));

  return issues
    .filter(i => orphanKeys.has(getIssueKey(i)))
    .map(i => {
      const key    = getIssueKey(i);
      const type   = norm(i['Issue Type'] ?? i['type'] ?? '');
      const epic   = String(i['Epic Link']  ?? i['epicLink']  ?? i['epic']   ?? '').trim();
      const parent = String(i['Parent Key'] ?? i['parentKey'] ?? i['parent'] ?? '').trim();

      let classification: OrphanClassification;
      let deliveryImpact: string;
      let suggestedFix: string;

      if ((epic && !keySet.has(epic)) || (parent && !keySet.has(parent))) {
        classification = 'DANGLING_LINK';
        deliveryImpact = 'Issue references a parent or epic that is not in this export. Epic-level completion metrics are incomplete.';
        suggestedFix   = 'Re-export Jira with all related issues included, or manually verify the parent key exists.';
      } else if (CHILD_LEVEL.has(type)) {
        classification = 'MISSING_PARENT';
        deliveryImpact = 'Sub-tasks and bugs without a parent are invisible in story-level completion tracking.';
        suggestedFix   = 'Link this item to its parent Story or Task in Jira, then re-export.';
      } else if (STORY_LEVEL.has(type)) {
        classification = 'MISSING_EPIC';
        deliveryImpact = 'Stories without an Epic do not appear in roadmap or epic progress reporting.';
        suggestedFix   = 'Assign this item to an Epic in Jira using the Epic Link field, then re-export.';
      } else {
        classification = 'FULLY_ORPHANED';
        deliveryImpact = 'This item has no structural connection. It is invisible in all hierarchy-based reports.';
        suggestedFix   = 'Assign to an Epic and optionally a parent Story. Verify issue type is correctly set.';
      }

      return {
        key,
        summary:  String(i['Summary']  ?? i['summary']  ?? ''),
        type:     String(i['Issue Type'] ?? i['type']   ?? ''),
        status:   String(i['Status']   ?? i['status']   ?? ''),
        assignee: String(i['Assignee'] ?? i['assignee'] ?? 'Unassigned'),
        classification,
        deliveryImpact,
        suggestedFix,
      };
    });
}
