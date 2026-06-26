// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Delivery forecast engine — FCAST-01 to FCAST-23. Pure interpretation layer
// over already-computed DashboardMetrics (flow items + sprint throughput) —
// no new metric calculations beyond linear velocity extrapolation. Extracted
// from app/forecast/page.tsx (2026-06-26) so it can be unit tested without
// importing a 'use client' page module — same pattern as
// src/services/retro/retroInsights.service.ts.

import type { DashboardMetrics } from '@/types/metrics';
import type { ForecastResult, ForecastStatus, SprintPoint, WeakestFactor } from '@/types/forecast';

// Data-quality downgrade multipliers — same documented formula as the
// Coaching Confidence Score (product/ALGORITHM_SPEC.md), applied here to
// keep forecast confidence consistent with the rest of the app rather than
// inventing a second scale.
const WEAK_DOWNGRADE_MULTIPLIER = 0.75;
const CRITICAL_DOWNGRADE_MULTIPLIER = 0.5;

export function computeForecast(metrics: DashboardMetrics): ForecastResult {
  const flow = (metrics.flow?.items ?? []) as any[];

  const totalIssues     = flow.length;
  const doneIssues      = flow.filter((i: any) => /^done|complete|closed|resolved/i.test(i.status ?? '')).length;
  const remainingIssues = Math.max(0, totalIssues - doneIssues);
  const blockedCount    = flow.filter((i: any) => i.blocked || /block/i.test(i.status ?? '')).length;
  const criticalCount   = flow.filter((i: any) => /critical|highest/i.test(i.priority ?? '')).length;
  const completionPct   = totalIssues > 0 ? Math.round(doneIssues / totalIssues * 100) : 0;

  // Prefer throughput.sprint.sprints — it has all sprints and the correct `completedCount` field.
  // metrics.sprint.sprints is capped at 8 and uses `completedIssues` (legacy field name).
  const throughputSprints = (metrics.throughput?.sprint?.sprints ?? []) as any[];
  const legacySprints     = (metrics.sprint?.sprints ?? []) as any[];
  const useRich           = throughputSprints.length > 0;
  const sprints           = useRich ? throughputSprints : legacySprints;

  const getCount = (s: any): number =>
    useRich ? (s.completedCount ?? 0) : (s.completedIssues ?? s.completedCount ?? 0);
  const getName = (s: any): string =>
    useRich ? (s.sprintName ?? s.name ?? '?') : (s.name ?? s.sprint ?? '?');

  const validSprints  = sprints.filter((s: any) => getCount(s) > 0);
  const avgThroughput = validSprints.length > 0
    ? validSprints.reduce((acc: number, s: any) => acc + getCount(s), 0) / validSprints.length
    : 0;

  let cum = 0;
  const sprintPoints: SprintPoint[] = sprints.slice(-12).map((s: any) => {
    const done = getCount(s);
    cum += done;
    return { sprint: getName(s), done, total: totalIssues, cumDone: cum };
  });

  // FCAST-16/17 — per-sprint scope-change and blocked counts, only available
  // from the rich SprintThroughputSummary shape (not the legacy 8-sprint cap).
  const scopeTrend = useRich
    ? throughputSprints.slice(-12).map((s: any) => ({
        sprint: s.sprintName ?? '?',
        added: s.addedScopeCount ?? 0,
        removed: s.removedScopeCount ?? 0,
        blocked: s.blockedCount ?? 0,
      }))
    : [];

  let velocityTrend: ForecastResult['velocityTrend'] = 'stable';
  if (validSprints.length >= 3) {
    const recent    = validSprints.slice(-3).map((s: any) => getCount(s));
    const older     = validSprints.slice(0, -3).map((s: any) => getCount(s));
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const olderAvg  = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : recentAvg;
    velocityTrend   = recentAvg > olderAvg * 1.1 ? 'improving' : recentAvg < olderAvg * 0.9 ? 'declining' : 'stable';
  }

  if (totalIssues === 0 || avgThroughput === 0) {
    return {
      status: 'insufficient_data', totalIssues, doneIssues, remainingIssues, completionPct, avgThroughput: 0,
      sprintsRemaining: 0, weeksRemaining: 0, confidence: 'low',
      confidenceReason: 'Confidence is not available — no completed sprint throughput has been uploaded yet.',
      velocityTrend, weakestFactor: { kind: 'none', detail: '' }, adjustments: [], sprintPoints, blockedCount, criticalCount,
      estimatedEndDate: '—', scopeTrend,
    };
  }
  if (remainingIssues === 0) {
    return {
      status: 'complete', totalIssues, doneIssues, remainingIssues: 0, completionPct: 100, avgThroughput,
      sprintsRemaining: 0, weeksRemaining: 0, confidence: 'high',
      confidenceReason: 'All issues are complete — confidence is high by definition.',
      velocityTrend, weakestFactor: { kind: 'none', detail: '' }, adjustments: [], sprintPoints, blockedCount, criticalCount,
      estimatedEndDate: 'Complete', scopeTrend,
    };
  }

  const sprintsRemaining = remainingIssues / avgThroughput;
  const weeksRemaining   = Math.ceil(sprintsRemaining * 2);

  // FCAST-23 — fold Data Quality and per-metric confidence into the forecast
  // confidence, not just sprint count/velocity-trend/blocked-count. Same
  // downgrade multipliers as the Coaching Confidence Score.
  const structuralScore =
    validSprints.length >= 4 && velocityTrend !== 'declining' && blockedCount === 0 ? 90 :
    validSprints.length >= 2 && blockedCount < 3 ? 65 : 35;

  const relevantConfidence = [metrics.confidence?.sprintThroughput, metrics.confidence?.velocity].filter(Boolean);
  const metricScore = relevantConfidence.length > 0
    ? relevantConfidence.reduce((sum, c) => sum + c.confidence, 0) / relevantConfidence.length
    : structuralScore;

  const dataQualityBand = metrics.dataQuality?.band;
  const dqMultiplier =
    dataQualityBand === 'Critical' ? CRITICAL_DOWNGRADE_MULTIPLIER :
    dataQualityBand === 'Weak' ? WEAK_DOWNGRADE_MULTIPLIER : 1;

  const blendedScore = ((structuralScore + metricScore) / 2) * dqMultiplier;
  const confidence: ForecastResult['confidence'] = blendedScore >= 70 ? 'high' : blendedScore >= 40 ? 'medium' : 'low';

  const confidenceReason = dqMultiplier < 1
    ? `Confidence reduced — Data Quality is ${dataQualityBand} (${metrics.dataQuality.score}) and ${validSprints.length} sprint${validSprints.length !== 1 ? 's' : ''} of throughput history ${velocityTrend === 'declining' ? 'show a declining trend' : 'are available'}.`
    : `Based on ${validSprints.length} sprint${validSprints.length !== 1 ? 's' : ''} of throughput history, a ${velocityTrend} velocity trend, and Data Quality ${dataQualityBand ?? 'unknown'}.`;

  const status: ForecastStatus =
    remainingIssues === 0                          ? 'complete'   :
    criticalCount > 2 || blockedCount > 3          ? 'off_track'  :
    sprintsRemaining <= 6                          ? 'on_track'   :
    sprintsRemaining <= 12                         ? 'at_risk'    : 'off_track';

  // FCAST-20 — identify the single most significant drag on the forecast.
  // Checked in priority order: severe blockers > critical items > scope
  // instability > poor data quality > declining throughput > none.
  const totalAddedScope = scopeTrend.reduce((s, p) => s + p.added, 0);
  const weakestFactor: WeakestFactor =
    blockedCount > 3
      ? { kind: 'blockers', detail: `${blockedCount} issues are blocked — this is the largest single drag on throughput.` }
      : criticalCount > 2
        ? { kind: 'blockers', detail: `${criticalCount} critical/highest-priority issues remain unresolved.` }
        : totalAddedScope > avgThroughput * 2
          ? { kind: 'scope', detail: `${totalAddedScope} items were added mid-sprint across recent sprints — scope is growing faster than capacity.` }
          : dqMultiplier < 1
            ? { kind: 'data_quality', detail: `Data Quality is ${dataQualityBand} (${metrics.dataQuality.score}/100) — the forecast itself is only as reliable as the underlying data.` }
            : velocityTrend === 'declining'
              ? { kind: 'throughput', detail: 'Throughput has declined over the last 3 sprints relative to earlier sprints.' }
              : { kind: 'none', detail: 'No single dominant risk factor — the forecast reflects steady, unremarkable delivery.' };

  // FCAST-21 — adjustment recommendations, each gated by a real signal.
  const adjustments: string[] = [];
  if (blockedCount > 0)               adjustments.push(`Unblock ${blockedCount} blocked item${blockedCount > 1 ? 's' : ''} to recover capacity.`);
  if (criticalCount > 0)              adjustments.push(`Address ${criticalCount} critical item${criticalCount > 1 ? 's' : ''} — they affect forecast confidence.`);
  if (velocityTrend === 'declining')  adjustments.push('Throughput is declining. Reduce WIP and review sprint commitments.');
  if (velocityTrend === 'improving')  adjustments.push('Throughput is improving. Current trajectory is positive.');
  if (totalAddedScope > avgThroughput * 2) adjustments.push(`${totalAddedScope} items were added mid-sprint recently — tighten sprint-start scope discipline or renegotiate sprint goals before adding more.`);
  if (remainingIssues > avgThroughput * 10) adjustments.push('Consider descoping low-priority items or splitting large stories to hit nearer milestones.');
  if (dqMultiplier < 1) adjustments.push(`Improve Data Quality (currently ${dataQualityBand}) — refinement on missing fields will sharpen this forecast.`);
  if (adjustments.length === 0)       adjustments.push('Velocity is stable. Maintain current pace to deliver on forecast.');

  const endDate = new Date(Date.now() + weeksRemaining * 7 * 86_400_000);
  const estimatedEndDate = endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    status, totalIssues, doneIssues, remainingIssues, completionPct,
    avgThroughput: parseFloat(avgThroughput.toFixed(1)),
    sprintsRemaining: parseFloat(sprintsRemaining.toFixed(1)), weeksRemaining,
    confidence, confidenceReason, velocityTrend, weakestFactor, adjustments, sprintPoints,
    blockedCount, criticalCount, estimatedEndDate, scopeTrend,
  };
}
