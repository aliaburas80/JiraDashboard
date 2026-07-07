// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Legacy basic Excel export safety tests — TC-SEC-CSV-08 to TC-SEC-CSV-09

import * as XLSX from 'xlsx';
import { exportToExcelBasic } from '../lib/exportUtils';
import type { DashboardMetrics, FlowItem } from '../types/metrics';

const writeFileMock = jest.fn();
jest.mock('xlsx', () => ({
  ...jest.requireActual('xlsx'),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
}));

function makeMetrics(item: Partial<FlowItem>): DashboardMetrics {
  return {
    healthScore: 80,
    totalIssues: 1,
    doneIssues: 0,
    completionRate: 0,
    activeIssues: 1,
    blockedIssues: 1,
    openDefects: 0,
    flow: {
      averageLeadTimeDays: 0,
      averageCycleTimeDays: 0,
      items: [{
        key: 'PROJ-1',
        summary: 'Normal summary',
        type: 'Story',
        status: 'In Progress',
        sprint: 'Sprint 1',
        epic: 'EPIC-1',
        assignee: 'Ali',
        priority: 'High',
        storyPoints: 3,
        health: 'critical',
        reason: 'Blocked by dependency',
        labels: '',
        project: 'PROJ',
        ...item,
      }],
    },
    storyPoints: { totalStoryPoints: 3, completedStoryPoints: 0, pointCompletionRate: 0 },
    capacity: [{ assignee: item.assignee ?? 'Ali', issues: 1, activeIssues: 1, doneIssues: 0, storyPoints: 3, doneStoryPoints: 0, loadShare: 100 }],
    sprint: { hasSprintData: true, sprints: [{ name: item.sprint ?? 'Sprint 1', issues: 1, completedIssues: 0, completionRate: 0, committedPoints: 3, completedPoints: 0, pointCompletionRate: 0 }] },
  } as unknown as DashboardMetrics;
}

beforeEach(() => writeFileMock.mockClear());

test('TC-SEC-CSV-08: exportToExcelBasic neutralizes formula-like Jira fields', async () => {
  await exportToExcelBasic(makeMetrics({
    summary: '=cmd|\'/c calc\'!A1',
    assignee: '+HYPERLINK("http://evil.example","click")',
    reason: '@SUM(A1)',
    sprint: '-10+20',
  }));

  const [workbook] = writeFileMock.mock.calls[0] as [XLSX.WorkBook, string];
  expect(workbook.Sheets['All Issues'].B2.v).toBe("'=cmd|'/c calc'!A1");
  expect(workbook.Sheets['All Issues'].G2.v).toBe('\'+HYPERLINK("http://evil.example","click")');
  expect(workbook.Sheets['All Issues'].E2.v).toBe("'-10+20");
  expect(workbook.Sheets['All Issues'].K2.v).toBe("'@SUM(A1)");
});

test('TC-SEC-CSV-09: exportToExcelBasic leaves benign Jira fields unchanged', async () => {
  await exportToExcelBasic(makeMetrics({
    summary: 'Normal summary',
    assignee: 'Ali',
    reason: 'Blocked by dependency',
    sprint: 'Sprint 1',
  }));

  const [workbook] = writeFileMock.mock.calls[0] as [XLSX.WorkBook, string];
  expect(workbook.Sheets['All Issues'].B2.v).toBe('Normal summary');
  expect(workbook.Sheets['All Issues'].G2.v).toBe('Ali');
  expect(workbook.Sheets['All Issues'].E2.v).toBe('Sprint 1');
  expect(workbook.Sheets['All Issues'].K2.v).toBe('Blocked by dependency');
});
