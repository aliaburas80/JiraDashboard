// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Delivery forecast domain types. Shared by the forecast engine
// (src/services/forecast/forecastEngine.service.ts) and the /forecast page.

export type ForecastStatus = 'on_track' | 'at_risk' | 'off_track' | 'complete' | 'insufficient_data';

export interface SprintPoint {
  sprint:  string;
  done:    number;
  total:   number;
  cumDone: number;
}

// RETRO-style naming kept consistent with the rest of the app's forecast
// vocabulary — the "weakest factor" answers "why aren't we on track?"
// (FCAST-20) so the recommendation it pairs with is never generic.
export type WeakestFactorKind = 'throughput' | 'blockers' | 'scope' | 'data_quality' | 'none';

export interface WeakestFactor {
  kind:   WeakestFactorKind;
  detail: string;
}

export interface ForecastResult {
  status:           ForecastStatus;
  totalIssues:      number;
  doneIssues:        number;
  remainingIssues:  number;
  completionPct:    number;
  avgThroughput:    number;
  sprintsRemaining: number;
  weeksRemaining:   number;
  confidence:       'high' | 'medium' | 'low';
  // FCAST-23 — plain-English reason citing real numbers, never generic,
  // mirroring the Coaching confidence "reason" convention.
  confidenceReason: string;
  velocityTrend:    'improving' | 'stable' | 'declining';
  // FCAST-20 — the single most significant drag on the forecast.
  weakestFactor:    WeakestFactor;
  adjustments:      string[];
  sprintPoints:     SprintPoint[];
  blockedCount:     number;
  criticalCount:    number;
  estimatedEndDate: string;
  // FCAST-16/17 — per-sprint scope-change and blocked counts, when rich
  // sprint data (SprintThroughputSummary) is available; empty otherwise.
  scopeTrend:       { sprint: string; added: number; removed: number; blocked: number }[];
}
