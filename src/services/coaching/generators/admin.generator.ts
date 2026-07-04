// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Admin insights (RBC-09) — storage, data, security, governance, diagnostics.
// Data-quality-heavy, not delivery-metric-heavy. Admin operational signals are
// optional (only available when the requesting role is admin and the page
// fetched them); when absent, the generator omits that evidence rather than
// fabricating it.

import type { DashboardMetrics } from '@/types/metrics';
import type { CeremonyAdvice, CoachingEvidence, RoleBasedCoachingInsight } from '@/types/roleBasedCoaching';
import type { AdminCoachingSignals } from '../adminSignals.service';
import { aggregateCategoryConfidence } from '../coachingConfidence.service';
import { deriveSeverity } from '@/lib/coachingBadge';

export function generateAdminInsight(
  metrics: DashboardMetrics,
  ceremonyAdvice: CeremonyAdvice,
  adminSignals?: AdminCoachingSignals,
): RoleBasedCoachingInsight {
  const dataQuality = metrics.dataQuality;

  const evidence: CoachingEvidence[] = [];
  const weakPoints: string[] = [];
  const focusAreas: string[] = [];
  const recommendedActions: string[] = [];
  const preventionAdvice: string[] = [];

  evidence.push({
    metricKey: 'dataQuality.score',
    label: 'Data Quality',
    value: `${dataQuality.score} (${dataQuality.band})`,
    detail: dataQuality.summary,
  });

  if (dataQuality.band === 'Weak' || dataQuality.band === 'Critical') {
    weakPoints.push(`Data Quality is ${dataQuality.band} (${dataQuality.score}/100).`);
    recommendedActions.push('Review the failing data-quality checks and communicate required-field gaps to upload owners.');
  }

  if (dataQuality.criticalCount > 0) {
    weakPoints.push(`${dataQuality.criticalCount} critical data-quality check(s) are failing.`);
  }

  if (adminSignals) {
    if (adminSignals.unresolvedErrorCount > 0) {
      evidence.push({
        metricKey: 'adminSignals.unresolvedErrorCount',
        label: 'Unresolved System Errors',
        value: String(adminSignals.unresolvedErrorCount),
        detail: `${adminSignals.unresolvedErrorCount} system error(s) are logged and unresolved.`,
      });
      weakPoints.push(`${adminSignals.unresolvedErrorCount} unresolved system error(s) are logged.`);
      recommendedActions.push('Review and triage the unresolved System Error Log entries.');
    }

    evidence.push({
      metricKey: 'adminSignals.storageProvider',
      label: 'Storage Provider',
      value: adminSignals.storageProvider,
      detail: `Active storage provider is "${adminSignals.storageProvider}".`,
    });

    if (!adminSignals.cloudSyncOk) {
      evidence.push({
        metricKey: 'adminSignals.cloudSyncOk',
        label: 'Cloud Sync Status',
        value: 'Stale or unavailable',
        detail: adminSignals.cloudSyncFetchedAt
          ? `Cloud cache was last fetched at ${adminSignals.cloudSyncFetchedAt}, which is stale.`
          : 'No cloud cache metadata is available.',
      });
      weakPoints.push('Cloud sync is stale or unavailable.');
      focusAreas.push('Confirm cloud storage credentials and connectivity are still valid.');
      preventionAdvice.push('Set up monitoring/alerting on cloud-sync freshness rather than discovering staleness here.');
    }
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('Data quality and system diagnostics look healthy — no immediate admin action needed.');
  }
  if (focusAreas.length === 0) {
    focusAreas.push('Maintain current data-quality and storage diagnostics review cadence.');
  }

  const confidence = aggregateCategoryConfidence(metrics, ['healthScore']);
  const severity = deriveSeverity(weakPoints.length, confidence.score, dataQuality.band === 'Critical');

  return {
    category: 'admin',
    healthSummary: weakPoints.length > 0
      ? `${weakPoints.length} operational/data-quality risk(s) detected — see weak points and evidence below.`
      : 'Data quality and system diagnostics look stable.',
    weakPoints,
    focusAreas,
    recommendedActions,
    preventionAdvice,
    ceremonyAdvice,
    nextSprintSuggestions: [
      dataQuality.band === 'Weak' || dataQuality.band === 'Critical'
        ? 'Communicate required-field gaps to upload owners before the next import.'
        : 'Continue current data-quality review cadence.',
    ],
    evidence,
    severity,
    confidence,
  };
}
