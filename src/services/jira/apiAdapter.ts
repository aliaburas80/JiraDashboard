// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// ARCH-05 Phase 1 (JIRA-06) — normalizes raw Jira REST API issue objects into
// the same canonical Record<string, unknown> shape src/services/jira/parser.ts's
// parseJiraFile() produces, so validateIssueData()/calculateDashboardMetrics()
// need zero changes regardless of whether data came from a file upload or a
// live Jira connection. See product/JIRA_INTEGRATION_DESIGN.md §4.

export interface JiraApiIssue {
  id?: string;
  key: string;
  fields: Record<string, unknown>;
}

/**
 * Standard Jira fields live at a fixed JSON path on every issue regardless of
 * instance — only custom fields (Epic Link, Story Points, Sprint, ...) need a
 * per-connection fieldMapping, because their field IDs (customfield_XXXXX)
 * vary per Jira instance.
 */
const STANDARD_FIELD_EXTRACTORS: Record<string, (fields: Record<string, unknown>) => unknown> = {
  'Issue Type':   f => (f.issuetype as { name?: string } | undefined)?.name,
  Summary:        f => f.summary,
  Status:         f => (f.status as { name?: string } | undefined)?.name,
  Project:        f => (f.project as { key?: string } | undefined)?.key,
  // The "parent" link (Sub-task → Story, or Epic → Initiative under team-managed
  // hierarchy levels) lives at a fixed path on every issue, just like status/project —
  // it is NOT a per-instance custom field, so it needs no fieldMapping entry.
  'Parent Key':   f => (f.parent as { key?: string } | undefined)?.key,
  Assignee:       f => (f.assignee as { displayName?: string } | undefined)?.displayName,
  Reporter:       f => (f.reporter as { displayName?: string } | undefined)?.displayName,
  Priority:       f => (f.priority as { name?: string } | undefined)?.name,
  Resolution:     f => (f.resolution as { name?: string } | undefined)?.name,
  Labels:         f => Array.isArray(f.labels) ? (f.labels as string[]).join(', ') : undefined,
  'Fix Version/s': f => Array.isArray(f.fixVersions)
    ? (f.fixVersions as Array<{ name?: string }>).map(v => v.name).filter(Boolean).join(', ')
    : undefined,
  'Created Date':    f => f.created,
  'Updated Date':    f => f.updated,
  'Resolution Date': f => f.resolutiondate,
  'Due Date':        f => f.duedate,
};

interface JiraSprintField {
  id?: number;
  name?: string;
  state?: string;
}

/**
 * Some canonical fields need shape-specific parsing once resolved from the
 * connection's fieldMapping (e.g. Sprint is an array of sprint objects/legacy
 * strings; Epic Link can be a plain key string or an object). Anything not
 * listed here is passed through as-is.
 */
function normalizeCustomFieldValue(canonical: string, raw: unknown): unknown {
  if (raw === null || raw === undefined) return undefined;

  switch (canonical) {
    case 'Story Points':
    case 'Business Value':
    case 'Risk Score':
      return typeof raw === 'number' ? raw : Number(raw) || undefined;

    case 'Sprint': {
      // Jira Cloud's Agile sprint field is an array (a single active sprint,
      // or every sprint an issue has ever been in) — use the most recent one.
      if (!Array.isArray(raw) || raw.length === 0) return undefined;
      const last = raw[raw.length - 1] as JiraSprintField | string;
      if (typeof last === 'string') {
        // Legacy non-JSON sprint string: "com.atlassian...[id=1,...,name=Sprint 5,state=ACTIVE,...]"
        const match = last.match(/name=([^,\]]+)/);
        return match ? match[1] : last;
      }
      return last?.name;
    }

    case 'Epic Link':
      if (typeof raw === 'string') return raw;
      return (raw as { key?: string; name?: string })?.key ?? (raw as { name?: string })?.name;

    default:
      return raw;
  }
}

/**
 * Converts one raw Jira REST API issue into the canonical flat shape. Standard
 * fields are read from their fixed path; any canonical field present in
 * `fieldMapping` (canonicalName -> jiraFieldId, e.g. "Story Points" ->
 * "customfield_10016") is resolved from `issue.fields[jiraFieldId]` and
 * shape-normalized. Standard-field extraction always takes precedence over a
 * mapping entry of the same canonical name.
 */
export function normalizeJiraIssue(
  issue: JiraApiIssue,
  fieldMapping: Record<string, string> = {},
): Record<string, unknown> {
  const fields = issue.fields ?? {};
  const out: Record<string, unknown> = { 'Issue Key': issue.key };

  for (const [canonical, extractor] of Object.entries(STANDARD_FIELD_EXTRACTORS)) {
    const value = extractor(fields);
    if (value !== undefined && value !== null && value !== '') out[canonical] = value;
  }

  for (const [canonical, jiraFieldId] of Object.entries(fieldMapping)) {
    if (canonical in out) continue; // a standard field already won
    const normalized = normalizeCustomFieldValue(canonical, fields[jiraFieldId]);
    if (normalized !== undefined) out[canonical] = normalized;
  }

  return out;
}

/** Converts an array of raw Jira REST API issues — see normalizeJiraIssue(). */
export function normalizeJiraIssues(
  issues: JiraApiIssue[],
  fieldMapping: Record<string, string> = {},
): Record<string, unknown>[] {
  return issues.map(issue => normalizeJiraIssue(issue, fieldMapping));
}
