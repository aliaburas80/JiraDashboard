// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Release confidence score (0–100) derived from upload metrics.
// Distinct from Health Score: focused on the four release-gate signals
// (completion, blockers, critical items, open defects).
//
// Formula weights:
//   55 pts — completion rate (proportional)
//   25 pts — no blocked issues (penalty proportional to blocked/total)
//   12 pts — no critical items (penalty proportional to critical/total)
//    8 pts — no open defects (0 = full 8pts; each defect costs 2pts)

export interface ReleaseConfidenceInputs {
  completionRate:  number;   // 0–100
  blockedIssues:   number;
  criticalCount:   number;
  openDefects:     number;
  totalIssues:     number;
}

export function computeReleaseConfidence(inputs: ReleaseConfidenceInputs): number {
  const { completionRate, blockedIssues, criticalCount, openDefects, totalIssues } = inputs;
  const total = Math.max(totalIssues, 1);

  const completionPts = (completionRate / 100) * 55;
  const blockedPts    = (1 - Math.min(blockedIssues  / total, 1)) * 25;
  const criticalPts   = (1 - Math.min(criticalCount  / total, 1)) * 12;
  const defectPts     = Math.max(0, 8 - openDefects * 2);

  return Math.round(Math.max(0, Math.min(100, completionPts + blockedPts + criticalPts + defectPts)));
}

export function releaseConfidenceBand(score: number): 'High' | 'Medium' | 'Low' | 'Critical' {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Critical';
}
