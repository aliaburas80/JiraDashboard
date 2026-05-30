// @ts-nocheck
// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

// ---------------------------------------------------------------------------
// Raw / parse-level types
// ---------------------------------------------------------------------------

export type JiraRawIssue = Record<string, unknown>;

export interface JiraFileInput {
  buffer: Buffer;
  originalname: string;
  size: number;
}

export interface ParseResult {
  issues: Record<string, unknown>[];
  warnings: string[];
  headers: string[];
  sheetName: string;
}

// ---------------------------------------------------------------------------
// Field name constants (mirrors parser OPTIONAL_FIELDS)
// ---------------------------------------------------------------------------

export const ESSENTIAL_FIELDS = [
  'Issue Key',
  'Issue Type',
  'Summary',
  'Status',
] as const;

export const OPTIONAL_FIELDS = [
  'Issue Key',
  'Issue Type',
  'Summary',
  'Epic Link',
  'Parent Key',
  'Project',
  'Component',
  'Team',
  'Assignee',
  'Reporter',
  'Status',
  'High Level Status',
  'Priority',
  'Risk Level',
  'Risk Description',
  'Labels',
  'Fix Version/s',
  'Sprint',
  'Sprint Goal',
  'Story Points',
  'Original Estimate',
  'Time Spent',
  'Remaining Estimate',
  'Created Date',
  'Updated Date',
  'Sprint Start',
  'Sprint End',
  'In Progress Date',
  'Code Review Date',
  'QA Start Date',
  'Done Date',
  'Due Date',
  'Resolution',
  'Resolution Date',
  'Reopened Count',
  'Blocked Flag',
  'Blocker Reason',
  'Commitment Type',
  'Added After Sprint Start',
  'Scope Change Type',
  'QA Pass',
  'UAT Status',
  'Defects Count',
  'Customer Visible',
  'Release Ready',
  'Acceptance Criteria Ready',
  'Definition of Ready Met',
  'Definition of Done Met',
  'Business Value',
  'Effort Confidence',
  'Planned Sprint',
  'Actual Sprint',
  'Dependencies',
  'Stakeholder Owner',
  'Requirement Stability',
  'Risk Score',
  'Last Comment',
  'Issue URL',
] as const;

export type EssentialField = (typeof ESSENTIAL_FIELDS)[number];
export type OptionalField = (typeof OPTIONAL_FIELDS)[number];

// ---------------------------------------------------------------------------
// Status constants and derived types
// ---------------------------------------------------------------------------

export const DONE_STATUSES = ['Done', 'Closed', 'Resolved'] as const;
export const IN_PROGRESS_STATUSES = [
  'In Progress',
  'Code Review',
  'QA',
  'Testing',
  'UAT',
] as const;

export type DoneStatus = (typeof DONE_STATUSES)[number];
export type InProgressStatus = (typeof IN_PROGRESS_STATUSES)[number];

export type IssueStatus = DoneStatus | InProgressStatus | string;

// ---------------------------------------------------------------------------
// Typed Jira issue
// ---------------------------------------------------------------------------

export interface JiraIssue {
  'Issue Key': string;
  'Issue Type': string;
  Summary: string;
  Status: IssueStatus;

  // Optional enriched fields
  'Epic Link'?: string;
  'Parent Key'?: string;
  Project?: string;
  Component?: string;
  Team?: string;
  Assignee?: string;
  Reporter?: string;
  'High Level Status'?: string;
  Priority?: string;
  'Risk Level'?: string;
  'Risk Description'?: string;
  Labels?: string;
  'Fix Version/s'?: string;
  Sprint?: string;
  'Sprint Goal'?: string;
  'Story Points'?: number | string;
  'Original Estimate'?: number | string;
  'Time Spent'?: number | string;
  'Remaining Estimate'?: number | string;
  'Created Date'?: string;
  'Updated Date'?: string;
  'Sprint Start'?: string;
  'Sprint End'?: string;
  'In Progress Date'?: string;
  'Code Review Date'?: string;
  'QA Start Date'?: string;
  'Done Date'?: string;
  'Due Date'?: string;
  Resolution?: string;
  'Resolution Date'?: string;
  'Reopened Count'?: number | string;
  'Blocked Flag'?: string | boolean;
  'Blocker Reason'?: string;
  'Commitment Type'?: string;
  'Added After Sprint Start'?: string | boolean;
  'Scope Change Type'?: string;
  'QA Pass'?: string | boolean;
  'UAT Status'?: string;
  'Defects Count'?: number | string;
  'Customer Visible'?: string | boolean;
  'Release Ready'?: string | boolean;
  'Acceptance Criteria Ready'?: string | boolean;
  'Definition of Ready Met'?: string | boolean;
  'Definition of Done Met'?: string | boolean;
  'Business Value'?: number | string;
  'Effort Confidence'?: string;
  'Planned Sprint'?: string;
  'Actual Sprint'?: string;
  Dependencies?: string;
  'Stakeholder Owner'?: string;
  'Requirement Stability'?: string;
  'Risk Score'?: number | string;
  'Last Comment'?: string;
  'Issue URL'?: string;

  // Allow additional dynamic fields surfaced after alias canonicalisation
  [key: string]: unknown;
}
