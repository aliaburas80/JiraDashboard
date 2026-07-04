// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// TC-JIRA-01 to TC-JIRA-28 — ARCH-05 Phase 1: Jira connection admin routes.
// JIRA-05/05c/06b — see product/JIRA_INTEGRATION_DESIGN.md.

export {};

const mockSession = {
  isLoggedIn: true,
  role: 'admin' as string,
  userId: 'admin-1',
  email: 'admin@test.com',
  name: 'Ada Admin',
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    jiraConnection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    importLog: {
      create: jest.fn(),
    },
  },
}));
jest.mock('@/lib/system-error-logger', () => ({
  safeAuditEvent: jest.fn(async () => {}),
}));
jest.mock('@/server/gateway/externalGateway', () => ({
  callExternal: jest.fn(),
}));
jest.mock('@/services/jira/connectionCredentials', () => ({
  encryptJiraConnectionToken: jest.fn((token: string) => `encrypted:${token}`),
  getJiraConnectionToken: jest.fn((connection: { apiTokenEncrypted?: string | null }) => (
    connection.apiTokenEncrypted ? 'secret-token' : ''
  )),
  resolveJiraConnectionToken: jest.fn((connection: { apiTokenEncrypted?: string | null }) => (
    connection.apiTokenEncrypted
      ? { ok: true, token: 'secret-token' }
      : { ok: false, error: 'No Jira API token is configured for this connection.' }
  )),
  hasJiraConnectionToken: jest.fn((connection: { apiTokenEncrypted?: string | null }) => (
    !!connection.apiTokenEncrypted
  )),
}));
jest.mock('@/services/jira/sync', () => ({
  fetchAllJiraIssues: jest.fn(),
}));
jest.mock('@/services/metrics/latestMetricsStorage', () => ({
  writeLatestMetrics: jest.fn(),
}));
jest.mock('@/services/storage/cloudSync', () => ({
  pushToCloud: jest.fn(async () => ({ status: 'pushed' })),
}));

import { prisma } from '@/lib/prisma';
import { callExternal } from '@/server/gateway/externalGateway';
import { encryptJiraConnectionToken, resolveJiraConnectionToken } from '@/services/jira/connectionCredentials';
import { fetchAllJiraIssues } from '@/services/jira/sync';

function makeReq(body: unknown) {
  return {
    json: jest.fn(async () => body),
    headers: { get: jest.fn(() => null) },
  } as any;
}

function connection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conn-1',
    name: 'Production Jira',
    deploymentType: 'cloud',
    baseUrl: 'https://example.atlassian.net',
    authEmail: 'svc@example.com',
    apiTokenEncrypted: null,
    projectFilters: '["PROJ"]',
    fieldMapping: '{}',
    refreshMode: 'manual',
    refreshIntervalMinutes: 30,
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncError: null,
    createdByUserId: 'admin-1',
    createdAt: new Date('2026-06-20T00:00:00.000Z'),
    updatedAt: new Date('2026-06-20T00:00:00.000Z'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.role = 'admin';
});

// ── GET /api/admin/jira-connections ───────────────────────────────────────────

test('TC-JIRA-01: GET jira-connections — unauthenticated returns 401', async () => {
  mockSession.isLoggedIn = false;
  const { GET } = await import('../../app/api/admin/jira-connections/route');
  const res = await GET();
  expect(res.status).toBe(401);
});

test('TC-JIRA-02: GET jira-connections — non-admin returns 403', async () => {
  mockSession.role = 'scrum_master';
  const { GET } = await import('../../app/api/admin/jira-connections/route');
  const res = await GET();
  expect(res.status).toBe(403);
});

test('TC-JIRA-03: GET jira-connections — admin lists connections without exposing a token', async () => {
  (prisma.jiraConnection.findMany as jest.Mock).mockResolvedValue([connection()]);
  const { GET } = await import('../../app/api/admin/jira-connections/route');
  const res = await GET();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.connections).toHaveLength(1);
  expect(body.connections[0].name).toBe('Production Jira');
  expect(body.connections[0].projectFilters).toEqual(['PROJ']);
  expect(body.connections[0].hasApiToken).toBe(false);
  expect(body.connections[0]).not.toHaveProperty('token');
});

test('TC-JIRA-03b: GET jira-connections — malformed stored JSON falls back safely', async () => {
  (prisma.jiraConnection.findMany as jest.Mock).mockResolvedValue([
    connection({ projectFilters: 'AJ', fieldMapping: 'not-json' }),
  ]);
  const { GET } = await import('../../app/api/admin/jira-connections/route');
  const res = await GET();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.connections[0].projectFilters).toEqual([]);
  expect(body.connections[0].fieldMapping).toEqual({});
});

// ── POST /api/admin/jira-connections ──────────────────────────────────────────

test('TC-JIRA-04: POST jira-connections — returns 400 when required fields are missing', async () => {
  const { POST } = await import('../../app/api/admin/jira-connections/route');
  const res = await POST(makeReq({ name: 'X' }));
  const body = await res.json();
  expect(res.status).toBe(400);
  expect(body.error).toMatch(/required/i);
});

test('TC-JIRA-05: POST jira-connections — returns 400 for an invalid deployment type', async () => {
  const { POST } = await import('../../app/api/admin/jira-connections/route');
  const res = await POST(makeReq({ name: 'X', deploymentType: 'on-prem', baseUrl: 'https://x.com' }));
  expect(res.status).toBe(400);
});

test('TC-JIRA-06: POST jira-connections — Cloud connection without an email returns 400', async () => {
  const { POST } = await import('../../app/api/admin/jira-connections/route');
  const res = await POST(makeReq({ name: 'X', deploymentType: 'cloud', baseUrl: 'https://x.atlassian.net' }));
  const body = await res.json();
  expect(res.status).toBe(400);
  expect(body.error).toMatch(/email/i);
});

test('TC-JIRA-07: POST jira-connections — invalid base URL returns 400', async () => {
  const { POST } = await import('../../app/api/admin/jira-connections/route');
  const res = await POST(makeReq({ name: 'X', deploymentType: 'server', baseUrl: 'not-a-url' }));
  expect(res.status).toBe(400);
});

test('TC-JIRA-08: POST jira-connections — creates a connection and audits it', async () => {
  (prisma.jiraConnection.create as jest.Mock).mockResolvedValue(connection());
  const { POST } = await import('../../app/api/admin/jira-connections/route');
  const res = await POST(makeReq({
    name: 'Production Jira',
    deploymentType: 'cloud',
    baseUrl: 'https://example.atlassian.net',
    authEmail: 'svc@example.com',
    apiToken: 'secret-token',
    projectFilters: ['PROJ'],
  }));
  const body = await res.json();

  expect(res.status).toBe(201);
  expect(body.ok).toBe(true);
  expect(prisma.jiraConnection.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ name: 'Production Jira', deploymentType: 'cloud' }),
    }),
  );
  expect(encryptJiraConnectionToken).toHaveBeenCalledWith('secret-token');
});

// ── POST /api/admin/jira-connections/[id]/test ────────────────────────────────

test('TC-JIRA-09: test connection — returns 404 when the connection does not exist', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(null);
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/test/route');
  const res = await POST(makeReq({}), { params: { id: 'missing' } });
  expect(res.status).toBe(404);
});

test('TC-JIRA-10: test connection — returns 409 when the connection has no token', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection());
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/test/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();
  expect(res.status).toBe(409);
  expect(body.error).toMatch(/for this connection/);
});

test('TC-JIRA-10b: test connection — returns 409 when the stored token cannot be decrypted', async () => {
  (resolveJiraConnectionToken as jest.Mock).mockReturnValueOnce({
    ok: false,
    error: 'The Jira API token saved for this connection cannot be decrypted.',
  });
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'stale-ciphertext' }));
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/test/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();

  expect(res.status).toBe(409);
  expect(body.error).toMatch(/cannot be decrypted/);
});

test('TC-JIRA-11: test connection — success calls the gateway with Basic auth for Cloud and records lastSyncStatus', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'encrypted-token' }));
  (callExternal as jest.Mock).mockResolvedValue({
    ok: true,
    data: { displayName: 'Service Account' },
    requestId: 'req-1',
    durationMs: 10,
    retryCount: 0,
    provider: 'jira',
    operation: 'jira.testConnection',
  });

  const { POST } = await import('../../app/api/admin/jira-connections/[id]/test/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(body.account).toBe('Service Account');
  expect(callExternal).toHaveBeenCalledWith(
    expect.objectContaining({
      provider: 'jira',
      path: '/rest/api/3/myself',
      baseUrlOverride: 'https://example.atlassian.net',
      credentialsPresentOverride: true,
      headers: expect.objectContaining({
        Authorization: `Basic ${Buffer.from('svc@example.com:secret-token').toString('base64')}`,
      }),
    }),
  );
  expect(prisma.jiraConnection.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ lastSyncStatus: 'success' }) }),
  );
});

test('TC-JIRA-12: test connection — uses Bearer auth and the v2 endpoint for Server/DC', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(
    connection({ deploymentType: 'server', authEmail: null, apiTokenEncrypted: 'encrypted-token' }),
  );
  (callExternal as jest.Mock).mockResolvedValue({
    ok: true,
    data: { name: 'svc-account' },
    requestId: 'req-2',
    durationMs: 10,
    retryCount: 0,
    provider: 'jira',
    operation: 'jira.testConnection',
  });

  const { POST } = await import('../../app/api/admin/jira-connections/[id]/test/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });

  expect(res.status).toBe(200);
  expect(callExternal).toHaveBeenCalledWith(
    expect.objectContaining({
      path: '/rest/api/2/myself',
      headers: expect.objectContaining({ Authorization: 'Bearer secret-token' }),
    }),
  );
});

test('TC-JIRA-13: test connection — gateway failure records lastSyncStatus failed and returns 502', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'encrypted-token' }));
  (callExternal as jest.Mock).mockResolvedValue({
    ok: false,
    errorCategory: 'non_retryable_http',
    error: 'HTTP 401: Unauthorized',
    requestId: 'req-3',
    durationMs: 10,
    retryCount: 0,
    provider: 'jira',
    operation: 'jira.testConnection',
  });

  const { POST } = await import('../../app/api/admin/jira-connections/[id]/test/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();

  expect(res.status).toBe(502);
  expect(body.ok).toBe(false);
  expect(prisma.jiraConnection.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ lastSyncStatus: 'failed' }) }),
  );
});

// ── GET /api/admin/jira-connections/[id]/fields (JIRA-06b) ───────────────────

test('TC-JIRA-25: field discovery — returns 404 when the connection does not exist', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(null);
  const { GET } = await import('../../app/api/admin/jira-connections/[id]/fields/route');
  const res = await GET(makeReq({}), { params: { id: 'missing' } });
  expect(res.status).toBe(404);
});

test('TC-JIRA-26: field discovery — returns 409 when no Jira token is configured', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection());
  const { GET } = await import('../../app/api/admin/jira-connections/[id]/fields/route');
  const res = await GET(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();
  expect(res.status).toBe(409);
  expect(body.error).toMatch(/for this connection/);
});

test('TC-JIRA-27: field discovery — success returns the field list from the gateway', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'encrypted-token' }));
  (callExternal as jest.Mock).mockResolvedValue({
    ok: true,
    data: [{ id: 'customfield_10016', name: 'Story Points' }, { id: 'summary', name: 'Summary' }],
    requestId: 'req-4',
    durationMs: 10,
    retryCount: 0,
    provider: 'jira',
    operation: 'jira.discoverFields',
  });

  const { GET } = await import('../../app/api/admin/jira-connections/[id]/fields/route');
  const res = await GET(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(body.fields).toEqual([
    { id: 'customfield_10016', name: 'Story Points' },
    { id: 'summary', name: 'Summary' },
  ]);
  expect(callExternal).toHaveBeenCalledWith(
    expect.objectContaining({ path: '/rest/api/3/field', baseUrlOverride: 'https://example.atlassian.net' }),
  );
});

test('TC-JIRA-28: field discovery — gateway failure returns 502', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'encrypted-token' }));
  (callExternal as jest.Mock).mockResolvedValue({
    ok: false,
    error: 'HTTP 401: Unauthorized',
    requestId: 'req-5',
    durationMs: 10,
    retryCount: 0,
    provider: 'jira',
    operation: 'jira.discoverFields',
  });

  const { GET } = await import('../../app/api/admin/jira-connections/[id]/fields/route');
  const res = await GET(makeReq({}), { params: { id: 'conn-1' } });
  expect(res.status).toBe(502);
});

// ── POST /api/admin/jira-connections/[id]/sync (JIRA-07) ─────────────────────

function rawJiraIssue(key: string) {
  return {
    key,
    fields: {
      issuetype: { name: 'Story' },
      summary: `Issue ${key}`,
      status: { name: 'Done' },
      project: { key: 'PROJ' },
    },
  };
}

test('TC-JIRA-40: sync — unauthenticated returns 401', async () => {
  mockSession.isLoggedIn = false;
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/sync/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  expect(res.status).toBe(401);
});

test('TC-JIRA-41: sync — non-admin returns 403', async () => {
  mockSession.role = 'scrum_master';
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/sync/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  expect(res.status).toBe(403);
});

test('TC-JIRA-42: sync — returns 404 when the connection does not exist', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(null);
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/sync/route');
  const res = await POST(makeReq({}), { params: { id: 'missing' } });
  expect(res.status).toBe(404);
});

test('TC-JIRA-43: sync — returns 409 when no Jira token is configured', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection());
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/sync/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  expect(res.status).toBe(409);
});

test('TC-JIRA-44: sync — fetch failure returns 502 and records lastSyncStatus failed', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'encrypted-token' }));
  (fetchAllJiraIssues as jest.Mock).mockResolvedValue({ ok: false, error: 'HTTP 401: Unauthorized' });

  const { POST } = await import('../../app/api/admin/jira-connections/[id]/sync/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });

  expect(res.status).toBe(502);
  expect(prisma.jiraConnection.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ lastSyncStatus: 'failed' }) }),
  );
});

test('TC-JIRA-44b: sync — a config error (e.g. no project keys) returns 409, not 502', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'encrypted-token' }));
  (fetchAllJiraIssues as jest.Mock).mockResolvedValue({
    ok: false,
    error: 'This connection has no valid project keys configured.',
    configError: true,
  });

  const { POST } = await import('../../app/api/admin/jira-connections/[id]/sync/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });

  expect(res.status).toBe(409);
});

test('TC-JIRA-45: sync — validation failure (no issues) returns 422 without writing metrics', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'encrypted-token' }));
  (fetchAllJiraIssues as jest.Mock).mockResolvedValue({ ok: true, issues: [], truncated: false });

  const { POST } = await import('../../app/api/admin/jira-connections/[id]/sync/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();

  expect(res.status).toBe(422);
  expect(body.error).toMatch(/validation/i);
  expect(prisma.importLog.create).not.toHaveBeenCalled();
});

test('TC-JIRA-46: sync — success writes latest metrics, an ImportLog (sourceType: "api"), and marks the connection successful', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection({ apiTokenEncrypted: 'encrypted-token' }));
  (fetchAllJiraIssues as jest.Mock).mockResolvedValue({
    ok: true,
    issues: [rawJiraIssue('PROJ-1'), rawJiraIssue('PROJ-2')],
    truncated: false,
  });
  (prisma.importLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });

  const { POST } = await import('../../app/api/admin/jira-connections/[id]/sync/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(body.totalIssues).toBeGreaterThanOrEqual(0);

  const { writeLatestMetrics } = await import('@/services/metrics/latestMetricsStorage');
  expect(writeLatestMetrics).toHaveBeenCalled();

  expect(prisma.importLog.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ sourceType: 'api', jiraConnectionId: 'conn-1', status: 'success' }),
    }),
  );
  expect(prisma.jiraConnection.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ lastSyncStatus: 'success', lastSyncError: null }) }),
  );
});
