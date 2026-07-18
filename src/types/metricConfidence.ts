// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

export type ConfidenceBand = 'High' | 'Medium' | 'Low' | 'Unreliable' | 'N/A';

export interface MetricConfidence {
  metricKey:      string;
  metricLabel:    string;
  confidence:     number;        // 0–100
  band:           ConfidenceBand;
  reason:         string;        // plain-English explanation
  sampleSize:     number;        // how many issues contributed
  requiredFields: string[];      // which fields this metric needs
  missingFields:  string[];      // which required fields were missing/incomplete
}

export interface MetricConfidenceMap {
  leadTime:         MetricConfidence;
  cycleTime:        MetricConfidence;
  sprintThroughput: MetricConfidence;
  velocity:         MetricConfidence;
  storyPoints:      MetricConfidence;
  kanbanFlow:       MetricConfidence;
  healthScore:      MetricConfidence;
  orphanRisk:       MetricConfidence;
  midSprint:        MetricConfidence;
  teamCapacity:     MetricConfidence;
  releaseReadiness: MetricConfidence;
  // CP3-017: unlike every metric above (which measures field completeness),
  // this measures raw sample size — a dataset can have 100% field
  // completeness while still being too small for its Data Quality
  // percentages to be statistically meaningful.
  dataQuality:      MetricConfidence;
}
