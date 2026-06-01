// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export interface OrphanRules {
  // Fields checked for a parent link — item is an orphan if NONE of these have a value
  parentLinkFields: string[];          // default: ['Epic Link', 'Parent Key']

  // Issue types that are never flagged as orphans (they are hierarchy roots)
  exemptIssueTypes: string[];          // default: ['Epic']

  // Whether Sub-tasks/Subtasks with no Parent Key are flagged as orphans
  flagSubTasksWithoutParent: boolean;  // default: true

  // Minimum number of orphans before it shows as a risk signal on the dashboard
  riskThresholdCount: number;          // default: 1

  // Orphan ratio above which it affects the health score (0–100)
  riskThresholdPct: number;            // default: 10

  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_ORPHAN_RULES: OrphanRules = {
  parentLinkFields:          ['Epic Link', 'Parent Key'],
  exemptIssueTypes:          ['Epic'],
  flagSubTasksWithoutParent: true,
  riskThresholdCount:        1,
  riskThresholdPct:          10,
  updatedAt:                 '',
  updatedBy:                 'system',
};

// Additional fields that can optionally be used as parent link indicators
export const OPTIONAL_PARENT_FIELDS = [
  'Epic Link',
  'Parent Key',
  'Component/s',
  'Project',
  'Labels',
  'Fix Version/s',
];

export const COMMON_ISSUE_TYPES = [
  'Epic', 'Story', 'Task', 'Sub-task', 'Bug',
  'Spike', 'Technical Debt', 'Risk', 'Change Request',
];
