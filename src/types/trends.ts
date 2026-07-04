// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

export interface TrendPoint {
  id:                      string;
  fileName:                string;
  uploadedAt:              string;
  healthScore:             number;
  totalIssues:             number;
  doneIssues:              number;
  completionRate:          number;
  blockedIssues:           number;
  activeIssues:            number;
  openDefects:             number;
  avgLeadTimeDays:         number;
  avgCycleTimeDays:        number;
  criticalCount:           number;
  dataQualityScore:        number | null;
  avgSprintThroughput:     number | null;
  releaseConfidenceScore?: number | null;
}
