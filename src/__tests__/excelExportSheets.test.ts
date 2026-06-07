// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Smart Excel export — sheet-content and trigger-flow tests, TC-X-09 to TC-X-13
// Closes the F4-05/06/08 traceability gap: the Risks & Blockers, Orphan & Data
// Quality, Cycle & Lead Time percentile, and Release Readiness sheets, plus the
// dashboard/summary "Export → Excel" trigger, had implementation but no
// dedicated test coverage (UC-089, FR-242, FR-243).

import * as XLSX from 'xlsx';
import { buildInsightWorkbook } from '../services/export/excelInsightExport.service';
import { exportToExcel } from '../lib/exportUtils';
import type { DashboardMetrics, FlowItem } from '../types/metrics';

// `downloadInsightWorkbook` calls `XLSX.writeFile`, which writes a real file to
// disk in Node. Replace it with a capture so the trigger-flow tests can assert
// on the produced workbook/filename without touching the filesystem.
const writeFileMock = jest.fn();
jest.mock('xlsx', () => ({
  ...jest.requireActual('xlsx'),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
}));

// ── Minimal valid metrics fixture, with a configurable item list ─────────────

function makeMetrics(items: Array<Partial<FlowItem> & Record<string, unknown>>): DashboardMetrics {
  const flowItems = items as unknown as FlowItem[];
  return {
    totalIssues: items.length,
    doneIssues: items.filter(i => String(i.status ?? '').toLowerCase() === 'done').length,
    activeIssues: 0,
    blockedIssues: 0,
    openDefects: 0,
    completionRate: 50,
    customerVisibleProgress: 50,
    overallDeliveryConfidence: 70,
    totalCustomerVisible: items.length,
    healthScore: 65,
    flow: {
      issues: items.length, done: 0, good: 0, warning: 0, critical: 0,
      averageLeadTimeDays: 0, averageCycleTimeDays: 0,
      leadTimeSampleSize: 0, cycleTimeSampleSize: 0,
      items: flowItems,
    } as unknown as DashboardMetrics['flow'],
    sprint: { hasSprintData: false, sprintCount: 0, sprints: [] } as unknown as DashboardMetrics['sprint'],
    kanban: { byStatus: [], byHighLevelStatus: [] },
    quarters: [],
    capacity: [],
    epics: [],
    labels: {},
    types: [],
    projects: [],
    parents: [],
    relations: { hasLinks: false, totalLinks: 0, itemsWithLinks: 0, linkTypes: 0, linkStats: [] },
    risk: { blockedIssues: 0, overdueIssues: 0, highPriorityOpenIssues: 0, openDefects: 0 },
    storyPoints: { totalStoryPoints: 0, completedStoryPoints: 0, remainingStoryPoints: 0, pointCompletionRate: 0 },
    prediction: { complete: false, daysRemaining: null, predictedDate: null } as unknown as DashboardMetrics['prediction'],
    insights: [],
    throughput: {
      sprint: { sprints: [], totalSprints: 0, totalCommitted: 0, totalCompleted: 0,
        averageThroughputCount: 0, averageThroughputPoints: 0, averageCompletionPct: 0,
        averageMidSprintPct: 0, deliveryTrendValue: 0, trendDirection: 'Stable',
        bestSprintName: '', worstSprintName: '', endLoadedSprintCount: 0,
        blockedSprintCount: 0, overallDeliveryConfidence: 0 },
      kanban: { hasKanbanData: false, periods: [], avgThroughputPerPeriod: 0,
        avgCycleTimeDays: 0, avgLeadTimeDays: 0, avgFlowEfficiencyPct: 0,
        totalAgingWip: 0, overallFlowHealth: 'Healthy' },
      midSprint: [],
    } as unknown as DashboardMetrics['throughput'],
    dataQuality: { score: 80, band: 'Good' as const, totalIssues: items.length,
      checks: [], summary: '', affectedMetrics: [], criticalCount: 0, highCount: 0 },
    fieldImpacts: { hasIssues: false, critical: [], high: [], medium: [], low: [], all: [], topSummary: '' } as any,
    confidence: {} as any,
  };
}

function baseItem(key: string, overrides: Partial<FlowItem> & Record<string, unknown> = {}) {
  return {
    key, summary: `Summary of ${key}`, type: 'Story', status: 'In Progress',
    highLevelStatus: 'Active', sprint: 'Sprint 1', epic: 'EPIC-1',
    isOrphan: false, assignee: 'Ali', priority: 'Medium', storyPoints: 5,
    createdDate: '2025-01-01', startedDate: '2025-01-05', doneDate: '',
    leadTimeDays: null, cycleTimeDays: null, ageDays: 1, activeAgeDays: 1,
    labels: '', parent: '', project: 'PROJ', health: 'good' as const, reason: '',
    ...overrides,
  };
}

function sheetRows(wb: XLSX.WorkBook, name: string): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1 });
}

// ── TC-X-09: Risks and Blockers sheet (F4-05) ─────────────────────────────────

test('TC-X-09a: Risks and Blockers sheet sorts critical-first and assigns risk-tier suggested actions', () => {
  const critical = baseItem('PROJ-1', { health: 'critical', isBlocked: true, reason: 'Blocked flag is set.' });
  const warning  = baseItem('PROJ-2', { health: 'warning', ageDays: 20, reason: 'Aging in progress.' });
  const agedGood = baseItem('PROJ-3', { health: 'good', isBlocked: true, ageDays: 25, reason: 'Blocked but otherwise on track.' });
  const healthy  = baseItem('PROJ-4', { health: 'good', ageDays: 2 });

  const wb   = buildInsightWorkbook(makeMetrics([healthy, agedGood, warning, critical]));
  const rows = sheetRows(wb, '07 Risks and Blockers');
  const dataRows = rows.slice(1);

  expect(dataRows.map(r => r[0])).toEqual(['PROJ-1', 'PROJ-2', 'PROJ-3']);   // critical → warning → good, healthy excluded

  const [, , riskLevelCol, blockedCol, , , , , actionCol] = [0, 1, 6, 7, 8, 9, 10, 11, 11];
  expect(dataRows[0][riskLevelCol]).toBe('CRITICAL');
  expect(dataRows[0][blockedCol]).toBe('YES');
  expect(dataRows[0][actionCol]).toBe('Escalate immediately — assign owner and resolution date');
  expect(dataRows[1][actionCol]).toBe('Review in next standup — prevent further aging');
  expect(dataRows[2][actionCol]).toBe('Monitor — add to sprint backlog review');
});

test('TC-X-09b: Risks and Blockers sheet shows a clean-bill-of-health message when nothing is at risk', () => {
  const healthy = baseItem('PROJ-1', { health: 'good', ageDays: 2 });
  const wb   = buildInsightWorkbook(makeMetrics([healthy]));
  const rows = sheetRows(wb, '07 Risks and Blockers');
  expect(rows[1]).toEqual(['No risk items detected — delivery health looks good.']);
});

// ── TC-X-10: Orphan and Data Quality sheet (F4-05) ────────────────────────────

test('TC-X-10a: Orphan and Data Quality summary counts orphans, missing fields, and percentages', () => {
  const orphanNoSP   = baseItem('PROJ-1', { isOrphan: true, storyPoints: 0, assignee: 'Unassigned', sprint: '' });
  const orphanNoSpr  = baseItem('PROJ-2', { isOrphan: true, storyPoints: 3, assignee: 'Bob', sprint: 'No sprint' });
  const normal       = baseItem('PROJ-3', { isOrphan: false, storyPoints: 5, assignee: 'Ali', sprint: 'Sprint 1' });
  const unassignedSP = baseItem('PROJ-4', { isOrphan: false, storyPoints: 0, assignee: '', sprint: 'Sprint 2' });

  const wb   = buildInsightWorkbook(makeMetrics([orphanNoSP, orphanNoSpr, normal, unassignedSP]));
  const rows = sheetRows(wb, '08 Orphan & Data Quality');

  expect(rows).toContainEqual(['Orphan (no Epic/Parent)', 2, '50%', 'Missing from epic/roadmap reporting', 'Link to parent Epic in Jira']);
  expect(rows).toContainEqual(['Missing Story Points', 2, '50%', 'Velocity and SP charts are incomplete', 'Estimate all active items in story points']);
  expect(rows).toContainEqual(['Unassigned Items', 2, '50%', 'Capacity and workload reporting unreliable', 'Assign all active items to a team member']);
  expect(rows).toContainEqual(['No Sprint Field', 2, '50%', 'Sprint throughput charts exclude these items', 'Add Sprint column to Jira export']);
});

test('TC-X-10b: Orphan and Data Quality detail lists each orphan with its missing-link risk note', () => {
  const orphan = baseItem('PROJ-1', { isOrphan: true, ageDays: 12 });
  const normal = baseItem('PROJ-2', { isOrphan: false });

  const wb   = buildInsightWorkbook(makeMetrics([orphan, normal]));
  const rows = sheetRows(wb, '08 Orphan & Data Quality');
  const detailRow = rows.find(r => r[0] === 'PROJ-1');

  expect(detailRow).toEqual(['PROJ-1', 'Summary of PROJ-1', 'Story', 'In Progress', 'Ali', 12, 'Epic Link and Parent Key', 'Not visible in roadmap or epic-level completion metrics']);
  expect(rows.some(r => r[0] === 'PROJ-2')).toBe(false);   // non-orphan never appears in the detail block
});

test('TC-X-10c: Orphan and Data Quality reports a complete-hierarchy message when no orphans exist', () => {
  const normal = baseItem('PROJ-1', { isOrphan: false });
  const wb   = buildInsightWorkbook(makeMetrics([normal]));
  const rows = sheetRows(wb, '08 Orphan & Data Quality');
  expect(rows).toContainEqual(['No orphan items detected — hierarchy is complete.']);
});

// ── TC-X-11: Cycle & Lead Time percentile analysis (F4-06) ───────────────────

test('TC-X-11a: Cycle & Lead Time sheet computes median, P75, P85, and P95 from the sampled lead/cycle times', () => {
  const items = Array.from({ length: 10 }, (_, i) =>
    baseItem(`PROJ-${i + 1}`, { status: 'Done', leadTimeDays: i + 1, cycleTimeDays: i + 1 }));

  const wb   = buildInsightWorkbook(makeMetrics(items));
  const rows = sheetRows(wb, '11 Cycle & Lead Time');

  expect(rows).toContainEqual(['Average', 5.5, 5.5]);
  expect(rows).toContainEqual(['Median (P50)', 5, 5]);
  expect(rows).toContainEqual(['P75', 8, 8]);
  expect(rows).toContainEqual(['P85', 9, 9]);
  expect(rows).toContainEqual(['P95', 10, 10]);
  expect(rows).toContainEqual(['Sample Size', 10, 10]);
});

test('TC-X-11b: Cycle & Lead Time sheet ranks the slowest items by lead time, longest first', () => {
  const fast = baseItem('PROJ-FAST', { status: 'Done', leadTimeDays: 2, cycleTimeDays: 1 });
  const slow = baseItem('PROJ-SLOW', { status: 'Done', leadTimeDays: 30, cycleTimeDays: 25 });

  const wb   = buildInsightWorkbook(makeMetrics([fast, slow]));
  const rows = sheetRows(wb, '11 Cycle & Lead Time');
  const headerIdx = rows.findIndex(r => r[0] === 'TOP 20 SLOWEST ITEMS (by Lead Time)');
  const firstDataRow = rows[headerIdx + 2];   // header label, then column-name row, then first item row

  expect(firstDataRow[0]).toBe('PROJ-SLOW');
  expect(firstDataRow[4]).toBe(30);
});

// ── TC-X-12: Release Readiness sheet (F4-05) ──────────────────────────────────

test('TC-X-12: Release Readiness groups by Fix Version and assigns Go / Conditional Go / No-Go', () => {
  const goItems = Array.from({ length: 10 }, (_, i) =>
    baseItem(`GO-${i + 1}`, { status: 'Done', type: 'Story', health: 'good', fixVersion: 'v1.0 Stable' }));

  const conditionalItems = [
    ...Array.from({ length: 8 }, (_, i) => baseItem(`COND-${i + 1}`, { status: 'Done', type: 'Story', health: 'good', fixVersion: 'v2.0 Beta' })),
    baseItem('COND-9',  { status: 'In Progress', type: 'Bug',   health: 'critical', fixVersion: 'v2.0 Beta' }),
    baseItem('COND-10', { status: 'In Progress', type: 'Story', health: 'good',     fixVersion: 'v2.0 Beta' }),
  ];

  const noGoItems = [
    ...Array.from({ length: 5 }, (_, i) => baseItem(`NOGO-${i + 1}`, { status: 'Done', type: 'Story', health: 'good', fixVersion: 'v3.0 Early' })),
    ...Array.from({ length: 5 }, (_, i) => baseItem(`NOGO-OPEN-${i + 1}`, { status: 'Open', type: 'Story', health: 'critical', fixVersion: 'v3.0 Early' })),
  ];

  const wb   = buildInsightWorkbook(makeMetrics([...goItems, ...conditionalItems, ...noGoItems]));
  const rows = sheetRows(wb, '14 Release Readiness');

  const goRow   = rows.find(r => r[0] === 'v1.0 Stable')!;
  const condRow = rows.find(r => r[0] === 'v2.0 Beta')!;
  const noGoRow = rows.find(r => r[0] === 'v3.0 Early')!;

  expect(goRow).toEqual(['v1.0 Stable', 10, 10, 0, 0, 0, 0, '100%', 'Go']);
  expect(condRow[7]).toBe('80%');
  expect(condRow[8]).toBe('Conditional Go');
  expect(noGoRow[7]).toBe('50%');
  expect(noGoRow[8]).toBe('No-Go');
});

// ── TC-X-13: Export trigger — dashboard/summary "Export → Excel" button (F4-08) ─

beforeEach(() => writeFileMock.mockClear());

test('TC-X-13: exportToExcel triggers the documented 17-sheet smart workbook download with the default filename', async () => {
  const metrics = makeMetrics([baseItem('PROJ-1')]);
  await exportToExcel(metrics);

  expect(writeFileMock).toHaveBeenCalledTimes(1);
  const [workbook, filename] = writeFileMock.mock.calls[0];
  expect(filename).toBe('delivery-clarity-report.xlsx');
  expect((workbook as XLSX.WorkBook).SheetNames).toHaveLength(17);
  expect((workbook as XLSX.WorkBook).SheetNames[0]).toBe('01 Executive Summary');
});

test('TC-X-13b: exportToExcel honors a custom filename passed from the trigger', async () => {
  const metrics = makeMetrics([baseItem('PROJ-1')]);
  await exportToExcel(metrics, 'my-team-report.xlsx');

  const [, filename] = writeFileMock.mock.calls[0];
  expect(filename).toBe('my-team-report.xlsx');
});
