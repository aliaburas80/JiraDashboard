// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0A-07: GET /api/admin/security had zero audit logging despite disclosing
// sensitive configuration state (weak/default SESSION_SECRET/CONFIG_ENCRYPTION_KEY,
// DB path existence, etc.). This closes that gap and confirms it's threaded
// with the new per-request correlation ID.

export {};

let mockSession: { isLoggedIn: boolean; role?: string; userId?: string; email?: string } = {
  isLoggedIn: true,
  role: 'admin',
  userId: 'admin-1',
  email: 'admin@x.com',
};

const mockSafeAuditEvent = jest.fn();

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/system-error-logger', () => ({
  safeAuditEvent: (...a: unknown[]) => mockSafeAuditEvent(...a),
}));
jest.mock('@/services/settings/securityCheck.service', () => ({
  runSecurityChecks: jest.fn(() => ({
    checks: [],
    overallScore: 92,
    criticalFails: 0,
    isProductionReady: true,
  })),
}));

function fakeReq(id = 'req-abc') {
  return { headers: { get: (k: string) => (k === 'x-request-id' ? id : null) } } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = { isLoggedIn: true, role: 'admin', userId: 'admin-1', email: 'admin@x.com' };
});

test('GET /api/admin/security audits the view, carrying the correlation ID, after the admin guard passes', async () => {
  const { GET } = await import('../../app/api/admin/security/route');

  const response = await GET(fakeReq('req-abc'));
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.overallScore).toBe(92);
  expect(mockSafeAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
    userId: 'admin-1',
    eventType: 'admin_security_report_viewed',
    correlationId: 'req-abc',
  }));
});

test('a non-admin caller is rejected with 403 before any audit event is written', async () => {
  mockSession = { isLoggedIn: true, role: 'scrum_master', userId: 'user-1', email: 'user@x.com' };
  const { GET } = await import('../../app/api/admin/security/route');

  const response = await GET(fakeReq());

  expect(response.status).toBe(403);
  expect(mockSafeAuditEvent).not.toHaveBeenCalled();
});

test('an unauthenticated caller is rejected with 401 before any audit event is written', async () => {
  mockSession = { isLoggedIn: false };
  const { GET } = await import('../../app/api/admin/security/route');

  const response = await GET(fakeReq());

  expect(response.status).toBe(401);
  expect(mockSafeAuditEvent).not.toHaveBeenCalled();
});
