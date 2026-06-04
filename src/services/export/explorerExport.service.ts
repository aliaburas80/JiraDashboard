// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Work Item Explorer export — Excel (5 sheets) and CSV.
// Input: RelationGraph produced by buildRelationGraph().

import * as XLSX from 'xlsx';
import type { RelationGraph, RelationNode } from '@/types/relations';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeWs(rows: unknown[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  if (rows.length > 0) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: rows[0].length - 1 } }),
    };
  }
  return ws;
}

function colWidths(widths: number[]): XLSX.ColInfo[] {
  return widths.map(w => ({ wch: w }));
}

function freezeRow(ws: XLSX.WorkSheet): void {
  ws['!freeze'] = { xSplit: 0, ySplit: 1 } as any;
}

function depthLabel(depth: number): string {
  if (depth === -1) return 'Parent';
  if (depth === 0)  return 'Focus';
  return 'Child';
}

function boolLabel(v: boolean): string {
  return v ? 'Yes' : 'No';
}

// ── Issue row builder (shared by All Issues + Risk sheets) ────────────────────

const ISSUE_HEADER = [
  'Key', 'Summary', 'Type', 'Status', 'Health',
  'Assignee', 'Sprint', 'Story Points', 'Epic Link', 'Parent Key',
  'Blocked', 'Orphan', 'On Risk Path', 'Largest Branch', 'Focus Role',
  'Priority', 'Reason',
];

function nodeToRow(n: RelationNode): unknown[] {
  return [
    n.issueKey,
    n.summary,
    n.type,
    n.status,
    n.health,
    n.assignee || '(unassigned)',
    n.sprint    || '',
    n.storyPoints ?? '',
    n.epicLink  || '',
    n.parentKey || '',
    boolLabel(n.isBlocked),
    boolLabel(n.isOrphan),
    boolLabel(n.isOnRiskPath),
    boolLabel(n.isLargestBranch),
    depthLabel(n.depth),
    n.priority  || '',
    n.reason    || '',
  ];
}

// ── Sheet 1: Summary ─────────────────────────────────────────────────────────

function sheetSummary(graph: RelationGraph): XLSX.WorkSheet {
  const s = graph.stats;
  const rows: unknown[][] = [
    ['WORK ITEM EXPLORER — EXPORT SUMMARY'],
    ['Generated:', new Date().toLocaleString()],
    [],
    ['FOCUS ITEM'],
    ['Issue Key',            graph.focusKey],
    ['Issue Type',           graph.focusType],
    ['Connected Items',      graph.nodes.length],
    ['Orphan Items',         graph.orphanNodes.length],
    [],
    ['DELIVERY METRICS'],
    ['Total Related',        s.totalRelated],
    ['Completed',            s.completedCount],
    ['Open',                 s.openCount],
    ['Blocked',              s.blockedCount],
    ['Bugs',                 s.bugCount],
    ['Critical',             s.criticalCount],
    ['Orphans',              s.orphanCount],
    ['Dependencies',         s.dependencyCount],
    ['Completion %',         `${s.completionPct}%`],
    ['Blocked Ratio %',      `${Math.round(s.blockedRatio)}%`],
    ['Delivery Confidence',  `${Math.round(s.deliveryConfidence)}%`],
    [],
    ['STORY POINTS'],
    ['Total Story Points',     s.totalStoryPoints],
    ['Completed Story Points', s.completedStoryPoints],
    [],
    ['LARGEST UNFINISHED BRANCH'],
    ...(s.largestUnfinishedBranch ? [
      ['Branch Root Key',  s.largestUnfinishedBranch.rootKey],
      ['Branch Label',     s.largestUnfinishedBranch.rootLabel],
      ['Open in Branch',   s.largestUnfinishedBranch.openCount],
      ['Total in Branch',  s.largestUnfinishedBranch.totalCount],
      ['Branch Completion', `${s.largestUnfinishedBranch.completionPct}%`],
    ] : [['(none)', '']]),
    [],
    ['INSIGHTS'],
    ...graph.insights.map((insight, i) => [`${i + 1}.`, insight]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = colWidths([28, 48]);
  return ws;
}

// ── Sheet 2: All Issues ───────────────────────────────────────────────────────

function sheetAllIssues(graph: RelationGraph): XLSX.WorkSheet {
  const allNodes = [...graph.nodes, ...graph.orphanNodes];
  const rows: unknown[][] = [
    ISSUE_HEADER,
    ...allNodes.map(nodeToRow),
  ];
  if (rows.length === 1) rows.push(['(no issues)', ...Array(ISSUE_HEADER.length - 1).fill('')]);
  const ws = makeWs(rows);
  ws['!cols'] = colWidths([12, 40, 14, 16, 10, 18, 20, 12, 14, 14, 8, 8, 12, 14, 10, 10, 30]);
  freezeRow(ws);
  return ws;
}

// ── Sheet 3: Risk Items ───────────────────────────────────────────────────────

function sheetRiskItems(graph: RelationGraph): XLSX.WorkSheet {
  const riskNodes = graph.nodes.filter(
    n => n.isBlocked || n.health === 'critical' || n.isOnRiskPath,
  );
  const rows: unknown[][] = [
    ISSUE_HEADER,
    ...(riskNodes.length ? riskNodes.map(nodeToRow) : [['(no risk items)', ...Array(ISSUE_HEADER.length - 1).fill('')]]),
  ];
  const ws = makeWs(rows);
  ws['!cols'] = colWidths([12, 40, 14, 16, 10, 18, 20, 12, 14, 14, 8, 8, 12, 14, 10, 10, 30]);
  freezeRow(ws);
  return ws;
}

// ── Sheet 4: Orphans ──────────────────────────────────────────────────────────

function sheetOrphans(graph: RelationGraph): XLSX.WorkSheet {
  const orphans = graph.orphanNodes;
  const rows: unknown[][] = [
    ISSUE_HEADER,
    ...(orphans.length ? orphans.map(nodeToRow) : [['(no orphan items)', ...Array(ISSUE_HEADER.length - 1).fill('')]]),
  ];
  const ws = makeWs(rows);
  ws['!cols'] = colWidths([12, 40, 14, 16, 10, 18, 20, 12, 14, 14, 8, 8, 12, 14, 10, 10, 30]);
  freezeRow(ws);
  return ws;
}

// ── Sheet 5: Insights ─────────────────────────────────────────────────────────

function sheetInsights(graph: RelationGraph): XLSX.WorkSheet {
  const rows: unknown[][] = [
    ['#', 'Insight'],
    ...(graph.insights.length
      ? graph.insights.map((insight, i) => [i + 1, insight])
      : [[1, '(no insights generated)']]),
  ];
  const ws = makeWs(rows);
  ws['!cols'] = colWidths([4, 80]);
  freezeRow(ws);
  return ws;
}

// ── Public: build workbook (used by tests) ────────────────────────────────────

export function buildExplorerWorkbook(graph: RelationGraph): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetSummary(graph),    '01 Summary');
  XLSX.utils.book_append_sheet(wb, sheetAllIssues(graph),  '02 All Issues');
  XLSX.utils.book_append_sheet(wb, sheetRiskItems(graph),  '03 Risk Items');
  XLSX.utils.book_append_sheet(wb, sheetOrphans(graph),    '04 Orphans');
  XLSX.utils.book_append_sheet(wb, sheetInsights(graph),   '05 Insights');
  return wb;
}

// ── Public: download Excel ────────────────────────────────────────────────────

export function exportExplorerToExcel(graph: RelationGraph): void {
  const filename = `explorer-${graph.focusKey.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wb = buildExplorerWorkbook(graph);
  XLSX.writeFile(wb, filename);
}

// ── Public: download CSV (all issues) ────────────────────────────────────────

export function exportExplorerToCsv(graph: RelationGraph): void {
  const allNodes = [...graph.nodes, ...graph.orphanNodes];
  const csvRows = [
    ISSUE_HEADER.join(','),
    ...allNodes.map(n =>
      nodeToRow(n).map(v => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `explorer-${graph.focusKey.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
