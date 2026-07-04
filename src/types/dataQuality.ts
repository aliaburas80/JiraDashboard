// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

export type DataQualityBand = 'Excellent' | 'Good' | 'Fair' | 'Weak' | 'Critical';
export type CheckSeverity    = 'critical'  | 'high'  | 'medium' | 'low';

// ── 9.3 — Missing-column field impact ─────────────────────────────────────────

export interface FieldImpact {
  field:              string;       // canonical Jira field name
  label:              string;       // human-readable label
  isColumnAbsent:     boolean;      // true = column not in export at all
  missingCount:       number;
  totalApplicable:    number;
  missingPct:         number;
  severity:           CheckSeverity;
  whatYouSeeNow:      string;       // e.g. "Cycle Time shows 0d for 827 completed items"
  whatYoullGain:      string;       // e.g. "Accurate cycle time for all 1075 done items"
  dashboardLocations: string[];     // e.g. ["Full Report → Lead Time KPI", "Sprint Throughput"]
  fallbackUsed:       string | null; // e.g. "Sprint Start Date used as fallback for 245 items"
  suggestedFix:       string;
}

export interface FieldImpactReport {
  hasIssues:      boolean;
  critical:       FieldImpact[];
  high:           FieldImpact[];
  medium:         FieldImpact[];
  low:            FieldImpact[];
  all:            FieldImpact[];
  topSummary:     string;            // 1–2 sentence plain-English overview
}

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
