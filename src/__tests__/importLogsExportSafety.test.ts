// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Import-log workbook export safety tests — TC-SEC-CSV-10 to TC-SEC-CSV-11

import XLSX from 'xlsx';
import {
  exportImportLogsWorkbook,
  exportImportLogRecordsWorkbook,
  type ImportLog,
  type ImportLogRecord,
} from '../services/imports/importLogs.service';

function makeLog(overrides: Partial<ImportLog> = {}): ImportLog {
  return {
    id: 'log-1',
    importedAt: '2026-07-07T00:00:00.000Z',
    status: 'success',
    file: { name: 'jira-export.xlsx', sizeBytes: 100, mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    extraction: {
      sheetName: 'Issues',
      rowCount: 1,
      columnCount: 2,
      headers: ['Summary', 'Status'],
      missingOptionalWarnings: [],
      validationErrors: [],
      error: '',
    },
    statistics: {
      totalIssues: 1,
      doneIssues: 0,
      activeIssues: 1,
      completionRate: 0,
      averageLeadTimeDays: 0,
      averageCycleTimeDays: 0,
      criticalItems: 0,
      warningItems: 0,
      statusBreakdown: [{ name: 'Open', count: 1 }],
      issueTypeBreakdown: [{ name: 'Story', count: 1 }],
      assigneeBreakdown: [{ name: 'Ali', count: 1 }],
      projectBreakdown: [{ name: 'PROJ', count: 1 }],
      quarters: [{ quarter: '2026-Q3', issues: 1, doneIssues: 0, activeIssues: 1, completionRate: 0, averageLeadTimeDays: 0, averageCycleTimeDays: 0, critical: 0, warning: 0 }],
    },
    ...overrides,
  };
}

function workbookFrom(log: ImportLog): XLSX.WorkBook {
  return XLSX.read(exportImportLogsWorkbook([log]), { type: 'buffer' });
}

test('TC-SEC-CSV-10: import-log workbook neutralizes formula-like uploaded metadata', () => {
  const wb = workbookFrom(makeLog({
    file: { name: '=cmd|\'/c calc\'!A1', sizeBytes: 100, mimetype: 'text/csv' },
    extraction: {
      sheetName: '+Issues',
      rowCount: 1,
      columnCount: 2,
      headers: ['@Summary', 'Status'],
      missingOptionalWarnings: ['-missing optional field'],
      validationErrors: ['=bad field'],
      error: '',
    },
    statistics: {
      ...makeLog().statistics,
      statusBreakdown: [{ name: '@Open', count: 1 }],
    },
  }));

  const ws = wb.Sheets['Import Logs'];
  expect(ws.D2.v).toBe("'=cmd|'/c calc'!A1");
  expect(ws.G2.v).toBe("'+Issues");
  expect(ws.J2.v).toBe("'@Summary, Status");
  expect(ws.K2.v).toBe("'-missing optional field");
  expect(ws.L2.v).toBe("'=bad field");
  expect(ws.V2.v).toBe("'@Open: 1");
});

test('TC-SEC-CSV-11: import-log workbook leaves benign uploaded metadata unchanged', () => {
  const ws = workbookFrom(makeLog()).Sheets['Import Logs'];
  expect(ws.D2.v).toBe('jira-export.xlsx');
  expect(ws.G2.v).toBe('Issues');
  expect(ws.J2.v).toBe('Summary, Status');
  expect(ws.V2.v).toBe('Open: 1');
});

function makeRecord(overrides: Partial<ImportLogRecord> = {}): ImportLogRecord {
  return {
    id: 'log-1',
    timestamp: '2026-07-14T00:00:00.000Z',
    filename: 'jira-export.xlsx',
    rowCount: 10,
    status: 'success',
    filesize: 100,
    healthScore: 82,
    totalIssues: 10,
    userName: 'Ali Abu Ras',
    userEmail: 'ali@example.com',
    ...overrides,
  };
}

function recordWorkbookFrom(log: ImportLogRecord): XLSX.WorkBook {
  return XLSX.read(exportImportLogRecordsWorkbook([log]), { type: 'buffer' });
}

test('TC-SEC-CSV-12: database-backed import-log workbook neutralizes formula-like metadata', () => {
  const ws = recordWorkbookFrom(makeRecord({
    filename: '=cmd|\'/c calc\'!A1',
    status: '+success',
    userName: '@Ali Abu Ras',
    userEmail: '-ali@example.com',
  })).Sheets['Import Logs'];

  expect(ws.D2.v).toBe("'=cmd|'/c calc'!A1");
  expect(ws.C2.v).toBe("'+success");
  expect(ws.I2.v).toBe("'@Ali Abu Ras");
  expect(ws.J2.v).toBe("'-ali@example.com");
});

test('TC-SEC-CSV-13: database-backed import-log workbook leaves benign metadata unchanged', () => {
  const ws = recordWorkbookFrom(makeRecord()).Sheets['Import Logs'];
  expect(ws.D2.v).toBe('jira-export.xlsx');
  expect(ws.C2.v).toBe('success');
  expect(ws.I2.v).toBe('Ali Abu Ras');
  expect(ws.J2.v).toBe('ali@example.com');
});
