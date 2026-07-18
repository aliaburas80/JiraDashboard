// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Work Explorer (Jira issue browser, /work-explorer) CSV export — MPE-01.
// Exports exactly what the table currently shows: the caller passes the
// already search + filter narrowed FlowItem list, so the export always
// matches what the user is looking at.

import { buildSafeCsv } from '@/lib/exportSafety';
import type { FlowItem } from '@/types/metrics';

const HEADER = [
  'Key', 'Type', 'Priority', 'Summary', 'Status', 'Health', 'Assignee',
  'Epic', 'Sprint', 'Project', 'Story Points',
  'Age (days)', 'Lead Time (days)', 'Cycle Time (days)',
];

function itemToRow(item: FlowItem): unknown[] {
  return [
    item.key,
    item.type,
    item.priority || '',
    item.summary,
    item.status,
    item.health,
    item.assignee || '(unassigned)',
    item.epic || '',
    item.sprint || '',
    item.project || '',
    item.storyPoints ?? '',
    item.ageDays ?? '',
    item.leadTimeDays ?? '',
    item.cycleTimeDays ?? '',
  ];
}

export function buildWorkExplorerCsv(items: FlowItem[]): string {
  return buildSafeCsv([HEADER, ...items.map(itemToRow)], { alwaysQuote: true });
}

export function exportWorkExplorerToCsv(items: FlowItem[]): void {
  const csv = buildWorkExplorerCsv(items);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `work-explorer-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
