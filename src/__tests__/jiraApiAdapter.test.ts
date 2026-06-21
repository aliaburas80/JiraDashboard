// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// TC-JIRA-14 to TC-JIRA-24 — ARCH-05 Phase 1 (JIRA-06): normalizing raw Jira
// REST API issues into the canonical shape parseJiraFile() already produces.

import { normalizeJiraIssue, normalizeJiraIssues, type JiraApiIssue } from '../services/jira/apiAdapter';
import { validateIssueData } from '../services/jira/validation';

function rawIssue(overrides: Partial<JiraApiIssue['fields']> = {}, key = 'PROJ-1'): JiraApiIssue {
  return {
    id: '10001',
    key,
    fields: {
      issuetype: { name: 'Story' },
      summary: 'Implement login page',
      status: { name: 'In Progress' },
      project: { key: 'PROJ' },
      assignee: { displayName: 'Jane Doe' },
      reporter: { displayName: 'John Smith' },
      priority: { name: 'High' },
      created: '2026-06-01T10:00:00.000+0000',
      updated: '2026-06-10T10:00:00.000+0000',
      ...overrides,
    },
  };
}

test('TC-JIRA-14: normalizeJiraIssue maps standard fields to the canonical shape', () => {
  const out = normalizeJiraIssue(rawIssue());
  expect(out['Issue Key']).toBe('PROJ-1');
  expect(out['Issue Type']).toBe('Story');
  expect(out.Summary).toBe('Implement login page');
  expect(out.Status).toBe('In Progress');
  expect(out.Project).toBe('PROJ');
  expect(out.Assignee).toBe('Jane Doe');
  expect(out.Reporter).toBe('John Smith');
  expect(out.Priority).toBe('High');
  expect(out['Created Date']).toBe('2026-06-01T10:00:00.000+0000');
  expect(out['Updated Date']).toBe('2026-06-10T10:00:00.000+0000');
});

test('TC-JIRA-15: normalizeJiraIssue output passes validateIssueData()', () => {
  const out = normalizeJiraIssue(rawIssue());
  const { isValid, errors } = validateIssueData([out]);
  expect(isValid).toBe(true);
  expect(errors).toEqual([]);
});

test('TC-JIRA-16: missing optional standard fields are simply omitted, not set to null/undefined keys', () => {
  const out = normalizeJiraIssue(rawIssue({ assignee: null, priority: undefined }));
  expect('Assignee' in out).toBe(false);
  expect('Priority' in out).toBe(false);
});

test('TC-JIRA-17: Labels and Fix Version/s arrays are joined into comma-separated strings', () => {
  const out = normalizeJiraIssue(rawIssue({
    labels: ['backend', 'urgent'],
    fixVersions: [{ name: '1.0' }, { name: '1.1' }],
  }));
  expect(out.Labels).toBe('backend, urgent');
  expect(out['Fix Version/s']).toBe('1.0, 1.1');
});

test('TC-JIRA-18: a custom field present in fieldMapping resolves via the connection field ID', () => {
  const issue = rawIssue({ customfield_10016: 5 });
  const out = normalizeJiraIssue(issue, { 'Story Points': 'customfield_10016' });
  expect(out['Story Points']).toBe(5);
});

test('TC-JIRA-19: Story Points coerces a string customfield value to a number', () => {
  const issue = rawIssue({ customfield_10016: '8' });
  const out = normalizeJiraIssue(issue, { 'Story Points': 'customfield_10016' });
  expect(out['Story Points']).toBe(8);
});

test('TC-JIRA-20: Sprint resolves from the Jira Agile array (newest entry wins) when given as objects', () => {
  const issue = rawIssue({
    customfield_10020: [
      { id: 1, name: 'Sprint 4', state: 'closed' },
      { id: 2, name: 'Sprint 5', state: 'active' },
    ],
  });
  const out = normalizeJiraIssue(issue, { Sprint: 'customfield_10020' });
  expect(out.Sprint).toBe('Sprint 5');
});

test('TC-JIRA-21: Sprint resolves from the legacy greenhopper string format', () => {
  const issue = rawIssue({
    customfield_10020: ['com.atlassian.greenhopper.service.sprint.Sprint@1[id=2,rapidViewId=1,state=ACTIVE,name=Sprint 5,startDate=...]'],
  });
  const out = normalizeJiraIssue(issue, { Sprint: 'customfield_10020' });
  expect(out.Sprint).toBe('Sprint 5');
});

test('TC-JIRA-22: Epic Link resolves whether the raw value is a plain string or an object with a key', () => {
  const stringIssue = rawIssue({ customfield_10014: 'PROJ-100' });
  expect(normalizeJiraIssue(stringIssue, { 'Epic Link': 'customfield_10014' })['Epic Link']).toBe('PROJ-100');

  const objectIssue = rawIssue({ customfield_10014: { key: 'PROJ-200', name: 'Epic Name' } });
  expect(normalizeJiraIssue(objectIssue, { 'Epic Link': 'customfield_10014' })['Epic Link']).toBe('PROJ-200');
});

test('TC-JIRA-23: a standard field always wins over a fieldMapping entry of the same canonical name', () => {
  // Status is a standard field — even if a (nonsensical) mapping tries to override it
  // from a custom field, the standard extractor's value must be used.
  const issue = rawIssue({ customfield_99999: 'Should Not Win' });
  const out = normalizeJiraIssue(issue, { Status: 'customfield_99999' });
  expect(out.Status).toBe('In Progress');
});

test('TC-JIRA-24: normalizeJiraIssues maps an array and preserves issue order', () => {
  const issues = [rawIssue({}, 'PROJ-1'), rawIssue({}, 'PROJ-2'), rawIssue({}, 'PROJ-3')];
  const out = normalizeJiraIssues(issues, {});
  expect(out.map(i => i['Issue Key'])).toEqual(['PROJ-1', 'PROJ-2', 'PROJ-3']);
});
