// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Soft-launch persona preview switcher — TC-PP-01 to TC-PP-08.

let mockSession: { isLoggedIn: boolean; userId?: string; email?: string; isSuperAdmin?: boolean } = { isLoggedIn: false };

const mockSafeAuditEvent = jest.fn();
const files: Record<string, string> = {};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('../lib/system-error-logger', () => ({
  safeAuditEvent: (...a: unknown[]) => mockSafeAuditEvent(...a),
}));
jest.mock('fs', () => ({
  existsSync:   (p: string) => Object.prototype.hasOwnProperty.call(files, p),
  readFileSync: (p: string) => files[p],
  writeFileSync: (p: string, content: string) => { files[p] = content; },
  mkdirSync:    jest.fn(),
}));

import { readPersonaPreviewSettings, writePersonaPreviewSettings, invalidatePersonaPreviewCache } from '../services/settings/personaPreview.service';

function request(body?: unknown) {
  return {
    headers: { get: () => '127.0.0.1' },
    json: jest.fn(async () => body ?? {}),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = { isLoggedIn: false };
  for (const k of Object.keys(files)) delete files[k];
  invalidatePersonaPreviewCache();
});

// TC-PP-01: defaults to disabled when no settings file exists
test('TC-PP-01: readPersonaPreviewSettings defaults to disabled', () => {
  expect(readPersonaPreviewSettings().enabled).toBe(false);
});

// TC-PP-02: write then read round-trips
test('TC-PP-02: writePersonaPreviewSettings persists and readPersonaPreviewSettings reflects it', () => {
  writePersonaPreviewSettings({ enabled: true, updatedAt: '2026-07-08T00:00:00.000Z', updatedBy: 'admin@deliveryclarity.app' });
  const settings = readPersonaPreviewSettings();
  expect(settings.enabled).toBe(true);
  expect(settings.updatedBy).toBe('admin@deliveryclarity.app');
});

// TC-PP-03: GET requires authentication
test('TC-PP-03: GET /api/admin/persona-preview requires authentication', async () => {
  const { GET } = await import('../../app/api/admin/persona-preview/route');
  const res = await GET();
  expect(res.status).toBe(401);
});

// TC-PP-04: GET returns current settings for any logged-in user (not just admin)
test('TC-PP-04: GET returns settings for any logged-in, non-admin user', async () => {
  mockSession = { isLoggedIn: true, userId: 'user-1', email: 'member@test.com', isSuperAdmin: false };
  writePersonaPreviewSettings({ enabled: true, updatedAt: 'x', updatedBy: 'admin' });
  const { GET } = await import('../../app/api/admin/persona-preview/route');
  const res  = await GET();
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.settings.enabled).toBe(true);
});

// TC-PP-05: POST rejects a regular (non-super-admin) admin
test('TC-PP-05: POST is rejected for a regular admin', async () => {
  mockSession = { isLoggedIn: true, userId: 'admin-1', email: 'admin@test.com', isSuperAdmin: false };
  const { POST } = await import('../../app/api/admin/persona-preview/route');
  const res = await POST(request({ enabled: true }));
  expect(res.status).toBe(403);
  expect(readPersonaPreviewSettings().enabled).toBe(false);
});

// TC-PP-06: POST succeeds for the super-admin and audits the change
test('TC-PP-06: POST succeeds for the super-admin and logs an audit event', async () => {
  mockSession = { isLoggedIn: true, userId: 'super-1', email: 'root@deliveryclarity.app', isSuperAdmin: true };
  const { POST } = await import('../../app/api/admin/persona-preview/route');
  const res  = await POST(request({ enabled: true }));
  const body = await res.json();
  expect(res.status).toBe(200);
  expect(body.settings.enabled).toBe(true);
  expect(readPersonaPreviewSettings().enabled).toBe(true);
  expect(mockSafeAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
    eventType: 'admin_persona_preview_toggled',
  }));
});

// TC-PP-07: POST validates the enabled field
test('TC-PP-07: POST rejects a non-boolean "enabled" value', async () => {
  mockSession = { isLoggedIn: true, userId: 'super-1', email: 'root@deliveryclarity.app', isSuperAdmin: true };
  const { POST } = await import('../../app/api/admin/persona-preview/route');
  const res = await POST(request({ enabled: 'yes' }));
  expect(res.status).toBe(400);
});

// TC-PP-08: POST requires authentication
test('TC-PP-08: POST /api/admin/persona-preview requires authentication', async () => {
  const { POST } = await import('../../app/api/admin/persona-preview/route');
  const res = await POST(request({ enabled: true }));
  expect(res.status).toBe(401);
});

// TC-PP-09: every registration persona has focus content configured
test('TC-PP-09: PERSONA_FOCUS has an entry with at least one focus area for every persona', async () => {
  const { PERSONAS } = await import('../lib/personas');
  const { PERSONA_FOCUS } = await import('../config/personaFocus.config');
  for (const persona of PERSONAS) {
    expect(PERSONA_FOCUS[persona]).toBeDefined();
    expect(PERSONA_FOCUS[persona].focusAreas.length).toBeGreaterThan(0);
    expect(PERSONA_FOCUS[persona].summary.length).toBeGreaterThan(0);
  }
});
