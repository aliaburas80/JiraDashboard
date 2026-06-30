// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// TC-JIRA-54 to TC-JIRA-60 — POST /api/jira/sync (any logged-in user, not
// admin-only) and resolveActiveJiraConnection(). See TODO-List.md Section
// 19a, "JIRA-14" item: a dashboard-facing Sync button for every user type.

export {};

const mockSession = {
  isLoggedIn: true,
  role: 'user' as string,
  userId: 'user-1',
  email: 'user@test.com',
  name: 'Regular User',
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    jiraConnection: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    importLog: {
      create: jest.fn(),
    },
  },
}));
jest.mock('@/services/jira/connectionCredentials', () => ({
  getJiraConnectionToken: jest.fn((connection: { apiTokenEncrypted?: string | null }) => (
    connection.apiTokenEncrypted ? 'fake-token' : ''
  )),
  resolveJiraConnectionToken: jest.fn((connection: { apiTokenEncrypted?: string | null }) => (
    connection.apiTokenEncrypted
      ? { ok: true, token: 'fake-token' }
      : { ok: false, error: 'No Jira API token is configured for this connection.' }
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
import { fetchAllJiraIssues } from '@/services/jira/sync';

function connection(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conn-1',
    name: 'Production Jira',
    deploymentType: 'cloud',
    baseUrl: 'https://example.atlassian.net',
    authEmail: 'svc@example.com',
    apiTokenEncrypted: 'encrypted-token',
    projectFilters: '["PROJ"]',
    fieldMapping: '{}',
    refreshMode: 'manual',
    refreshIntervalMinutes: 30,
    lastSyncAt: null,
    lastSyncStatus: null,
    lastSyncError: null,
    createdByUserId: 'admin-1',
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.role = 'user';
});

// ── resolveActiveJiraConnection() ──────────────────────────────────────────────

describe('TC-JIRA-54 to TC-JIRA-56: resolveActiveJiraConnection()', () => {
  test('TC-JIRA-54: returns null when no connection exists', async () => {
    (prisma.jiraConnection.findMany as jest.Mock).mockResolvedValue([]);
    const { resolveActiveJiraConnection } = await import('@/services/jira/connectionSyncRunner');
    expect(await resolveActiveJiraConnection()).toBeNull();
  });

  test('TC-JIRA-55: prefers the most recently synced connection over a never-synced one', async () => {
    const older = connection({ id: 'conn-old', lastSyncAt: new Date('2026-06-01T00:00:00.000Z') });
    const newer = connection({ id: 'conn-new', lastSyncAt: new Date('2026-06-20T00:00:00.000Z') });
    const neverSynced = connection({ id: 'conn-never', lastSyncAt: null, createdAt: new Date('2026-06-22T00:00:00.000Z') });
    (prisma.jiraConnection.findMany as jest.Mock).mockResolvedValue([older, neverSynced, newer]);
    const { resolveActiveJiraConnection } = await import('@/services/jira/connectionSyncRunner');
    expect((await resolveActiveJiraConnection())?.id).toBe('conn-new');
  });

  test('TC-JIRA-56: falls back to the most recently created connection when none has ever synced', async () => {
    const older = connection({ id: 'conn-old', lastSyncAt: null, createdAt: new Date('2026-06-01T00:00:00.000Z') });
    const newer = connection({ id: 'conn-new', lastSyncAt: null, createdAt: new Date('2026-06-20T00:00:00.000Z') });
    (prisma.jiraConnection.findMany as jest.Mock).mockResolvedValue([older, newer]);
    const { resolveActiveJiraConnection } = await import('@/services/jira/connectionSyncRunner');
    expect((await resolveActiveJiraConnection())?.id).toBe('conn-new');
  });
});

// ── POST /api/jira/sync ────────────────────────────────────────────────────────

describe('TC-JIRA-57 to TC-JIRA-60: POST /api/jira/sync', () => {
  test('TC-JIRA-57: unauthenticated returns 401', async () => {
    mockSession.isLoggedIn = false;
    const { POST } = await import('../../app/api/jira/sync/route');
    const res = await POST();
    expect(res.status).toBe(401);
  });

  test('TC-JIRA-58: a non-admin regular user is allowed through (no role check)', async () => {
    mockSession.role = 'user';
    (prisma.jiraConnection.findMany as jest.Mock).mockResolvedValue([connection({ lastSyncAt: new Date() })]);
    (fetchAllJiraIssues as jest.Mock).mockResolvedValue({ ok: true, issues: [
      { key: 'PROJ-1', fields: { issuetype: { name: 'Story' }, summary: 'A', status: { name: 'Done' }, project: { key: 'PROJ' } } },
    ] });
    (prisma.importLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });
    const { POST } = await import('../../app/api/jira/sync/route');
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('TC-JIRA-59: returns 404 when no Jira connection is configured at all', async () => {
    (prisma.jiraConnection.findMany as jest.Mock).mockResolvedValue([]);
    const { POST } = await import('../../app/api/jira/sync/route');
    const res = await POST();
    expect(res.status).toBe(404);
  });

  test('TC-JIRA-60: a successful sync response includes which connection was used', async () => {
    (prisma.jiraConnection.findMany as jest.Mock).mockResolvedValue([connection({ name: 'Agile Jordan', lastSyncAt: new Date() })]);
    (fetchAllJiraIssues as jest.Mock).mockResolvedValue({ ok: true, issues: [
      { key: 'PROJ-1', fields: { issuetype: { name: 'Story' }, summary: 'A', status: { name: 'Done' }, project: { key: 'PROJ' } } },
    ] });
    (prisma.importLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });
    const { POST } = await import('../../app/api/jira/sync/route');
    const res = await POST();
    const body = await res.json();
    expect(body.connectionName).toBe('Agile Jordan');
  });
});
