// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// TC-JIRA-29 to TC-JIRA-39 — ARCH-05 Phase 1 (JIRA-07): JQL building +
// pagination through the Gateway for the manual "Sync now" route.

export {};

jest.mock('@/server/gateway/externalGateway', () => ({
  callExternal: jest.fn(),
}));

import { callExternal } from '@/server/gateway/externalGateway';
import { buildSyncJql, fetchAllJiraIssues } from '../services/jira/sync';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── buildSyncJql ───────────────────────────────────────────────────────────

test('TC-JIRA-29: buildSyncJql builds a project-scoped JQL from valid keys', () => {
  const result = buildSyncJql(['PROJ', 'TEAM2']);
  expect(result.ok).toBe(true);
  expect(result.jql).toBe('project in (PROJ,TEAM2) ORDER BY updated DESC');
});

test('TC-JIRA-30: buildSyncJql rejects when no project keys are configured', () => {
  const result = buildSyncJql([]);
  expect(result.ok).toBe(false);
  expect(result.error).toMatch(/project key/i);
});

test('TC-JIRA-31: buildSyncJql filters out a key with unsafe characters (never raw JQL injection)', () => {
  const result = buildSyncJql(['PROJ', 'x); DROP--']);
  expect(result.ok).toBe(true);
  expect(result.jql).toBe('project in (PROJ) ORDER BY updated DESC');
});

test('TC-JIRA-32: buildSyncJql rejects when every key is unsafe', () => {
  const result = buildSyncJql(['1bad', '--also-bad']);
  expect(result.ok).toBe(false);
});

// ── fetchAllJiraIssues ───────────────────────────────────────────────────────

function cloudConnection(overrides: Record<string, unknown> = {}) {
  return {
    baseUrl: 'https://example.atlassian.net',
    deploymentType: 'cloud',
    authEmail: 'svc@example.com',
    token: 'secret-token',
    projectFilters: ['PROJ'],
    fieldMapping: {},
    ...overrides,
  };
}

test('TC-JIRA-33: fetchAllJiraIssues fails fast with no Gateway call when projectFilters is invalid', async () => {
  const result = await fetchAllJiraIssues(cloudConnection({ projectFilters: [] }));
  expect(result.ok).toBe(false);
  expect(result.configError).toBe(true);
  expect(callExternal).not.toHaveBeenCalled();
});

test('TC-JIRA-34: fetchAllJiraIssues returns a Cloud connection error when authEmail is missing', async () => {
  const result = await fetchAllJiraIssues(cloudConnection({ authEmail: null }));
  expect(result.ok).toBe(false);
  expect(result.configError).toBe(true);
  expect(callExternal).not.toHaveBeenCalled();
});

test('TC-JIRA-35: fetchAllJiraIssues makes a single call when the first page has no nextPageToken (Cloud)', async () => {
  (callExternal as jest.Mock).mockResolvedValue({
    ok: true,
    data: { issues: [{ key: 'PROJ-1', fields: {} }, { key: 'PROJ-2', fields: {} }] },
  });

  const result = await fetchAllJiraIssues(cloudConnection());
  expect(result.ok).toBe(true);
  expect(result.issues).toHaveLength(2);
  expect(callExternal).toHaveBeenCalledTimes(1);
  expect(callExternal).toHaveBeenCalledWith(
    expect.objectContaining({
      path: '/rest/api/3/search/jql',
      baseUrlOverride: 'https://example.atlassian.net',
      headers: expect.objectContaining({
        Authorization: `Basic ${Buffer.from('svc@example.com:secret-token').toString('base64')}`,
      }),
    }),
  );
});

test('TC-JIRA-36: fetchAllJiraIssues paginates through multiple Cloud pages via nextPageToken', async () => {
  (callExternal as jest.Mock)
    .mockResolvedValueOnce({ ok: true, data: { issues: [{ key: 'PROJ-1', fields: {} }], nextPageToken: 'page2' } })
    .mockResolvedValueOnce({ ok: true, data: { issues: [{ key: 'PROJ-2', fields: {} }] } });

  const result = await fetchAllJiraIssues(cloudConnection());
  expect(result.ok).toBe(true);
  expect(result.issues?.map(i => i.key)).toEqual(['PROJ-1', 'PROJ-2']);
  expect(callExternal).toHaveBeenCalledTimes(2);
  expect((callExternal as jest.Mock).mock.calls[1][0].query.nextPageToken).toBe('page2');
});

test('TC-JIRA-37: fetchAllJiraIssues paginates Server/DC via startAt/total', async () => {
  (callExternal as jest.Mock)
    .mockResolvedValueOnce({ ok: true, data: { issues: [{ key: 'PROJ-1', fields: {} }], total: 2 } })
    .mockResolvedValueOnce({ ok: true, data: { issues: [{ key: 'PROJ-2', fields: {} }], total: 2 } });

  const result = await fetchAllJiraIssues(cloudConnection({ deploymentType: 'server', authEmail: null }));
  expect(result.ok).toBe(true);
  expect(result.issues).toHaveLength(2);
  expect(callExternal).toHaveBeenCalledTimes(2);
  expect((callExternal as jest.Mock).mock.calls[0][0].path).toBe('/rest/api/2/search');
  expect((callExternal as jest.Mock).mock.calls[0][0].headers.Authorization).toBe('Bearer secret-token');
  expect((callExternal as jest.Mock).mock.calls[1][0].query.startAt).toBe('1');
});

test('TC-JIRA-38: fetchAllJiraIssues stops and reports a Gateway failure mid-pagination without partial success', async () => {
  (callExternal as jest.Mock)
    .mockResolvedValueOnce({ ok: true, data: { issues: [{ key: 'PROJ-1', fields: {} }], nextPageToken: 'page2' } })
    .mockResolvedValueOnce({ ok: false, error: 'HTTP 503: Service Unavailable' });

  const result = await fetchAllJiraIssues(cloudConnection());
  expect(result.ok).toBe(false);
  expect(result.error).toMatch(/503/);
  expect(result.configError).toBeFalsy(); // a real Gateway/Jira failure, not a setup problem
});

test('TC-JIRA-39: fetchAllJiraIssues truncates at the safety cap and reports truncated: true', async () => {
  // 11 pages of 100 = 1100 issues; cap is 1000, so it must stop early.
  let call = 0;
  (callExternal as jest.Mock).mockImplementation(async () => {
    call += 1;
    const issues = Array.from({ length: 100 }, (_, i) => ({ key: `PROJ-${call * 100 + i}`, fields: {} }));
    return { ok: true, data: { issues, nextPageToken: `page${call + 1}` } };
  });

  const result = await fetchAllJiraIssues(cloudConnection());
  expect(result.ok).toBe(true);
  expect(result.truncated).toBe(true);
  expect(result.issues).toHaveLength(1000);
});
