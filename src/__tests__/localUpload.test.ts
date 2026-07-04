// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-017: local-storage-mode upload processing — TC-LU-01 to TC-LU-06.
// Confirms the client-side pipeline used by app/page.tsx's handleFile() in
// "local" storage mode never calls the network and produces the same shape
// POST /api/upload returns.

export {};

jest.mock('@/services/jira/parser', () => ({
  parseJiraFile: jest.fn(() => ({
    issues: [{ 'Issue Key': 'PROJ-1', 'Issue Type': 'Story', Summary: 'Test', Status: 'Done' }],
    warnings: [],
    headers: ['Issue Key'],
    rawHeaders: ['Issue Key'],
    sheetName: 'Sheet1',
    columnMapping: { missingEssential: [], mapped: [], unmapped: [] },
  })),
}));
jest.mock('@/services/jira/validation', () => ({
  validateIssueData: jest.fn(() => ({ isValid: true, errors: [] })),
}));
jest.mock('@/services/metrics/metrics.service', () => ({
  calculateDashboardMetrics: jest.fn(() => ({ totalIssues: 1, doneIssues: 1, healthScore: 90 })),
}));

import { processFileLocally, getFileExtension, LOCAL_MODE_MAX_FILE_SIZE_BYTES } from '../lib/localUpload';

function makeFile(name: string, sizeBytes = 100): File {
  const file = new File([new Uint8Array(sizeBytes)], name);
  return file;
}

const originalFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn() as any;
});
afterAll(() => { global.fetch = originalFetch; });

test('TC-LU-01: getFileExtension lowercases and extracts the extension', () => {
  expect(getFileExtension('Export.XLSX')).toBe('.xlsx');
  expect(getFileExtension('data.csv')).toBe('.csv');
});

test('TC-LU-02: processFileLocally rejects an unsupported extension without calling fetch', async () => {
  const result = await processFileLocally(makeFile('export.pdf'));
  expect('error' in result && result.error).toMatch(/unsupported file type/i);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-LU-03: processFileLocally rejects a file over the size limit without calling fetch', async () => {
  const result = await processFileLocally(makeFile('export.csv', LOCAL_MODE_MAX_FILE_SIZE_BYTES + 1));
  expect('error' in result && result.error).toMatch(/20 mb size limit/i);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-LU-04: processFileLocally never calls fetch for a valid file — everything stays client-side', async () => {
  const result = await processFileLocally(makeFile('export.csv'));
  expect('metrics' in result).toBe(true);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-LU-05: processFileLocally returns the same {metrics, warnings, columnMapping} shape POST /api/upload returns', async () => {
  const result = await processFileLocally(makeFile('export.csv'));
  expect(result).toEqual({
    metrics: { totalIssues: 1, doneIssues: 1, healthScore: 90 },
    warnings: [],
    columnMapping: { missingEssential: [], mapped: [], unmapped: [] },
  });
});

test('TC-LU-06: processFileLocally surfaces validation errors instead of saving', async () => {
  const { validateIssueData } = jest.requireMock('@/services/jira/validation');
  (validateIssueData as jest.Mock).mockReturnValueOnce({ isValid: false, errors: ['Missing required Jira fields: Issue Key'] });

  const result = await processFileLocally(makeFile('export.csv'));
  expect('error' in result && result.error).toBe('Validation failed');
  expect('details' in result && result.details).toEqual(['Missing required Jira fields: Issue Key']);
});
