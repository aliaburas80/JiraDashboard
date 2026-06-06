// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type ReleaseVerdict = 'Go' | 'Conditional Go' | 'No-Go' | 'Insufficient Data';

export interface ReleaseChecklistItem {
  id:       string;
  label:    string;
  passed:   boolean;
  detail:   string;
  blocking: boolean;   // if true, failure = No-Go regardless of other checks
}

export interface ReleaseReadinessResult {
  version:        string;
  scope:          number;
  completed:      number;
  open:           number;
  blockers:       number;
  openBugs:       number;
  criticalItems:  number;
  completionPct:  number;
  verdict:        ReleaseVerdict;
  verdictReason:  string;
  checklist:      ReleaseChecklistItem[];
  issues:         { key: string; summary: string; status: string; type: string; health: string }[];
}

export interface ReleaseReadinessSummary {
  releases:       ReleaseReadinessResult[];
  hasVersionData: boolean;
  totalVersions:  number;
  goCount:        number;
  conditionalCount: number;
  noGoCount:      number;
}
