// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Confidence aggregation (RBC-17) — averages the relevant MetricConfidenceMap
// entries for a coaching category, then downgrades the result when the
// underlying Data Quality band is Weak or Critical. Documented as a versioned
// business formula in product/ALGORITHM_SPEC.md.

import type { DashboardMetrics } from '@/types/metrics';
import type { MetricConfidenceMap, ConfidenceBand } from '@/types/metricConfidence';
import type { CoachingConfidence } from '@/types/roleBasedCoaching';

// Data-quality downgrade multipliers — see ALGORITHM_SPEC.md "Coaching Confidence Score".
const WEAK_DOWNGRADE_MULTIPLIER = 0.75;
const CRITICAL_DOWNGRADE_MULTIPLIER = 0.5;

function deriveBand(score: number, sampleSize: number): ConfidenceBand {
  if (sampleSize === 0) return 'N/A';
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Unreliable';
}

export function aggregateCategoryConfidence(
  metrics: DashboardMetrics,
  relevantKeys: (keyof MetricConfidenceMap)[],
): CoachingConfidence {
  const entries = relevantKeys.map((key) => metrics.confidence[key]);
  const withSamples = entries.filter((e) => e.sampleSize > 0);

  if (relevantKeys.length === 0 || withSamples.length === 0) {
    return {
      score: 0,
      band: 'N/A',
      reason: 'Confidence is not available — not enough underlying data has been uploaded yet for this category.',
    };
  }

  const rawAverage = entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length;

  const dataQualityBand = metrics.dataQuality.band;
  const multiplier =
    dataQualityBand === 'Critical' ? CRITICAL_DOWNGRADE_MULTIPLIER
    : dataQualityBand === 'Weak' ? WEAK_DOWNGRADE_MULTIPLIER
    : 1;

  const score = Math.round(rawAverage * multiplier);
  const sampleSize = withSamples.reduce((sum, e) => sum + e.sampleSize, 0);
  const band = deriveBand(score, sampleSize);

  const worst = entries.reduce((a, b) => (a.confidence <= b.confidence ? a : b));
  const reason = multiplier < 1
    ? `Confidence reduced — Data Quality is ${dataQualityBand} (${metrics.dataQuality.score}) and ${worst.metricLabel} confidence is ${worst.band} (${worst.confidence}%).`
    : `Based on ${worst.metricLabel} (${worst.band}, ${worst.confidence}%) and related metrics, all backed by ${sampleSize} sampled item${sampleSize !== 1 ? 's' : ''}.`;

  return { score, band, reason };
}
