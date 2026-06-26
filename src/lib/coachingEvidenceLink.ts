// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Maps a coaching evidence item's metricKey to the dashboard route that is the
// authoritative source for that metric family, so evidence chips can link out.

const METRIC_PREFIX_ROUTES: [prefix: string, route: string][] = [
  ['flow.', '/dashboard/flow-health'],
  ['throughput.kanban.', '/dashboard/kanban-health'],
  ['throughput.sprint.', '/dashboard/sprint-status'],
  ['relations.', '/dashboard/priority-attention'],
  ['risk.overdueIssues', '/dashboard/priority-attention'],
  ['risk.highPriorityOpenIssues', '/dashboard/delivery-controls'],
  ['prediction.', '/dashboard/delivery-controls'],
  ['overallDeliveryConfidence', '/dashboard/delivery-controls'],
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
