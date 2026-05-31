// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type DataQualityBand = 'Excellent' | 'Good' | 'Fair' | 'Weak' | 'Critical';
export type CheckSeverity    = 'critical'  | 'high'  | 'medium' | 'low';

export interface DataQualityCheck {
  field:          string;         // canonical Jira field name
  label:          string;         // human-readable label
  missing:        number;         // count of issues missing this field
  total:          number;         // total issues where field is applicable
  missingPct:     number;         // 0–100
  weight:         number;         // contribution to total score (sum of all weights = 100)
  severity:       CheckSeverity;
  affectsMetrics: string[];       // which dashboard metrics are degraded
  suggestedFix:   string;         // plain-English recommended action
}

export interface DataQualityResult {
  score:           number;           // 0–100
  band:            DataQualityBand;
  totalIssues:     number;
  checks:          DataQualityCheck[];
  summary:         string;           // auto-generated plain-English sentence
  affectedMetrics: string[];         // union of all affected metrics from failing checks
  criticalCount:   number;           // checks with severity=critical that are failing
  highCount:       number;
}
