// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Direct unit tests for validateIssueData (P0A-02) — previously exercised only
// indirectly, via jest.mock() stubs in other suites or one incidental
// happy-path assertion in jiraApiAdapter.test.ts (TC-JIRA-15). This suite
// covers the function's actual branches: empty input, missing fields, and
// non-array input (a real crash bug — issues.length was read unconditionally
// on the next line even when Array.isArray(issues) was false).

import { validateIssueData } from '../services/jira/validation';

function makeIssue(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    'Issue Key': 'PROJ-1',
    'Issue Type': 'Story',
    Summary: 'Test issue',
    Status: 'Done',
    ...overrides,
  };
}

test('TC-VAL-01: valid issues with all essential fields pass', () => {
  const result = validateIssueData([makeIssue()]);
  expect(result).toEqual({ isValid: true, errors: [] });
});

test('TC-VAL-02: empty array is invalid with a no-rows error', () => {
  const result = validateIssueData([]);
  expect(result.isValid).toBe(false);
  expect(result.errors).toContain('Uploaded file contains no issue rows.');
});

test('TC-VAL-03: missing essential fields are reported by name', () => {
  const issue = makeIssue();
  delete issue['Issue Type'];
  delete issue.Status;

  const result = validateIssueData([issue]);
  expect(result.isValid).toBe(false);
  expect(result.errors[0]).toBe('Missing required Jira fields: Issue Type, Status');
});

test('TC-VAL-04: non-array input does not throw and is reported invalid', () => {
  expect(() => validateIssueData(null as unknown as Record<string, unknown>[])).not.toThrow();
  expect(() => validateIssueData(undefined as unknown as Record<string, unknown>[])).not.toThrow();

  const result = validateIssueData(null as unknown as Record<string, unknown>[]);
  expect(result).toEqual({ isValid: false, errors: ['Uploaded file contains no issue rows.'] });
});

test('TC-VAL-05: header fields are read from the first row only', () => {
  const result = validateIssueData([makeIssue(), { 'Issue Key': 'PROJ-2' }]);
  expect(result.isValid).toBe(true);
});
