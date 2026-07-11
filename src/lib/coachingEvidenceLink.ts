// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Maps a coaching evidence item's metricKey to the dashboard route that is the
// authoritative source for that metric family, so evidence chips can link out.

const METRIC_PREFIX_ROUTES: [prefix: string, route: string][] = [
  ['flow.', '/dashboard/flow-health'],
  ['throughput.kanban.', '/dashboard/key-metrics'],
  ['throughput.sprint.', '/dashboard/trends'],
  ['relations.', '/dashboard/priority-attention'],
  ['risk.overdueIssues', '/dashboard/priority-attention'],
  ['risk.highPriorityOpenIssues', '/dashboard/key-metrics'],
  ['prediction.', '/dashboard/key-metrics'],
  ['overallDeliveryConfidence', '/dashboard/key-metrics'],
  ['capacity', '/dashboard/ownership'],
  ['dataQuality.', '/dashboard/data-quality'],
  ['epics[].', '/dashboard/epic-readiness'],
  ['adminSignals.', '/dashboard/summary'],
  ['healthScore', '/dashboard/summary'],
  ['completionRate', '/dashboard/summary'],
];

export function resolveEvidenceRoute(metricKey: string): string | null {
  const match = METRIC_PREFIX_ROUTES.find(([prefix]) => metricKey.startsWith(prefix));
  return match ? match[1] : null;
}
