// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// TC-JIRA-01 to TC-JIRA-10 — ARCH-05 Phase 1: Jira connection admin routes.
// JIRA-05 — see product/JIRA_INTEGRATION_DESIGN.md.

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
  },
}));
jest.mock('@/lib/system-error-logger', () => ({
  safeAuditEvent: jest.fn(async () => {}),
}));
jest.mock('@/server/gateway/externalGateway', () => ({
  callExternal: jest.fn(),
}));
jest.mock('@/lib/app-config', () => ({
  getJiraApiToken: jest.fn(async () => ''),
}));

import { prisma } from '@/lib/prisma';
import { callExternal } from '@/server/gateway/externalGateway';
import { getJiraApiToken } from '@/lib/app-config';

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
  (getJiraApiToken as jest.Mock).mockResolvedValue('');
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
  expect(body.connections[0].hasGatewayToken).toBe(false);
  expect(body.connections[0]).not.toHaveProperty('token');
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
});

// ── POST /api/admin/jira-connections/[id]/test ────────────────────────────────

test('TC-JIRA-09: test connection — returns 404 when the connection does not exist', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(null);
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/test/route');
  const res = await POST(makeReq({}), { params: { id: 'missing' } });
  expect(res.status).toBe(404);
});

test('TC-JIRA-10: test connection — returns 409 when GATEWAY_JIRA_API_TOKEN is not set', async () => {
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection());
  const { POST } = await import('../../app/api/admin/jira-connections/[id]/test/route');
  const res = await POST(makeReq({}), { params: { id: 'conn-1' } });
  const body = await res.json();
  expect(res.status).toBe(409);
  expect(body.error).toMatch(/GATEWAY_JIRA_API_TOKEN/);
});

test('TC-JIRA-11: test connection — success calls the gateway with Basic auth for Cloud and records lastSyncStatus', async () => {
  (getJiraApiToken as jest.Mock).mockResolvedValue('secret-token');
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection());
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
  (getJiraApiToken as jest.Mock).mockResolvedValue('secret-token');
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(
    connection({ deploymentType: 'server', authEmail: null }),
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
  (getJiraApiToken as jest.Mock).mockResolvedValue('secret-token');
  (prisma.jiraConnection.findUnique as jest.Mock).mockResolvedValue(connection());
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
