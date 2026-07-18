// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Visual Analytics (/charts) CSV export — MPE-01.
// The page has no single table — it's a grid of independent chart widgets —
// so the export is a sectioned CSV: one labeled block per widget that is
// currently visible (respecting the chart customizer's visibility prefs and
// the active tab), preceded by the KPI strip.

import { buildSectionedCsv, type CsvExportSection } from '@/lib/exportSafety';

export type { CsvExportSection as ChartExportSection };

export function buildChartsCsv(sections: CsvExportSection[]): string {
  return buildSectionedCsv(sections);
}

export function exportChartsToCsv(sections: CsvExportSection[]): void {
  const csv = buildChartsCsv(sections);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visual-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
