// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Delivery Mix (/delivery-mix) CSV export — MPE-01.
// Mirrors the columns already shown in the page's Type Detail Table, plus
// the category classification and % of total shown in the donut legend.

import { buildSafeCsv } from '@/lib/exportSafety';

// Shape matches the page's local `EnrichedType` (TypeEntry & { cat, pct }) —
// intentionally not imported from the page module (domain/service code must
// not depend on a presentation-layer file), so this only lists the fields
// actually needed for the export.
export interface DeliveryMixExportRow {
  type: string;
  cat: string;
  count: number;
  pct: number;
  done: number;
  completionRate: number;
  storyPoints: number;
  good: number;
  warning: number;
  critical: number;
  averageCycleTimeDays: number;
  cycleTimeSampleSize: number;
  averageLeadTimeDays: number;
  leadTimeSampleSize: number;
}

const HEADER = [
  'Issue Type', 'Category', 'Count', '% of Total', 'Done', 'Completion %',
  'Story Points', 'Good', 'Warning', 'Critical',
  'Avg Cycle Time (days)', 'Avg Lead Time (days)',
];

function rowToCsvRow(t: DeliveryMixExportRow): unknown[] {
  return [
    t.type,
    t.cat,
    t.count,
    t.pct,
    t.done,
    t.completionRate,
    t.storyPoints || '',
    t.good || '',
    t.warning || '',
    t.critical || '',
    t.cycleTimeSampleSize > 0 ? t.averageCycleTimeDays.toFixed(1) : '',
    t.leadTimeSampleSize > 0 ? t.averageLeadTimeDays.toFixed(1) : '',
  ];
}

export function buildDeliveryMixCsv(rows: DeliveryMixExportRow[]): string {
  return buildSafeCsv([HEADER, ...rows.map(rowToCsvRow)], { alwaysQuote: true });
}

export function exportDeliveryMixToCsv(rows: DeliveryMixExportRow[]): void {
  const csv = buildDeliveryMixCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `delivery-mix-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
