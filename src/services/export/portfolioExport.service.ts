// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Portfolio Overview (/portfolio) CSV export — MPE-01.
// Mirrors the columns already shown in the page's Epic Detail Table.

import { buildSafeCsv } from '@/lib/exportSafety';
import type { EpicSummary } from '@/lib/portfolioHealth';

const HEADER = [
  'Epic', 'Health', 'Issues', 'Completed', 'Progress %',
  'Story Points Done', 'Story Points Total', 'Point Progress %',
  'Critical', 'Warning', 'Good',
];

function epicToRow(e: EpicSummary): unknown[] {
  return [
    e.name,
    e.health,
    e.issues,
    e.completedIssues,
    e.progress,
    e.doneStoryPoints,
    e.storyPoints,
    e.pointProgress,
    e.critical,
    e.warning,
    e.good,
  ];
}

export function buildPortfolioEpicsCsv(epics: EpicSummary[]): string {
  return buildSafeCsv([HEADER, ...epics.map(epicToRow)], { alwaysQuote: true });
}

export function exportPortfolioEpicsToCsv(epics: EpicSummary[]): void {
  const csv = buildPortfolioEpicsCsv(epics);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio-epics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
