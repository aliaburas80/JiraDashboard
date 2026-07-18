// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Epic Roadmap (/roadmap) CSV export — MPE-01.
// Exports the currently filtered + sorted epic forecast list (Cards view
// filter/sort state), mirroring the fields shown on each epic card.

import { buildSafeCsv } from '@/lib/exportSafety';

// Shape matches the page's local `EpicForecast` (EpicSummary + forecast
// fields) — intentionally not imported from the page module, so this only
// lists the fields actually needed for the export.
export interface RoadmapExportRow {
  name: string;
  health: string;
  progress: number;
  issues: number;
  completedIssues: number;
  remainingIssues: number;
  storyPoints: number;
  doneStoryPoints: number;
  critical: number;
  warning: number;
  forecastLabel: string;
  sprintsRemaining: number | null;
  weeksRemaining: number | null;
  confidence: string;
}

const HEADER = [
  'Epic', 'Health', 'Progress %', 'Issues', 'Completed', 'Remaining',
  'Story Points Done', 'Story Points Total', 'Critical', 'Warning',
  'Forecast', 'Sprints Remaining', 'Weeks Remaining', 'Confidence',
];

function rowToCsvRow(e: RoadmapExportRow): unknown[] {
  return [
    e.name,
    e.health,
    e.progress,
    e.issues,
    e.completedIssues,
    e.remainingIssues,
    e.doneStoryPoints,
    e.storyPoints,
    e.critical,
    e.warning,
    e.forecastLabel,
    e.sprintsRemaining ?? '',
    e.weeksRemaining ?? '',
    e.confidence,
  ];
}

export function buildRoadmapCsv(rows: RoadmapExportRow[]): string {
  return buildSafeCsv([HEADER, ...rows.map(rowToCsvRow)], { alwaysQuote: true });
}

export function exportRoadmapToCsv(rows: RoadmapExportRow[]): void {
  const csv = buildRoadmapCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roadmap-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
