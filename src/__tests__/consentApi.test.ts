// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-03: GET/POST /api/consent — view and update consent status. Only the
// "analytics" purpose is togglable through this endpoint.

export {};

const mockSession: Record<string, unknown> = { isLoggedIn: true, userId: 'user-1' };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));

const mockGetConsentStatus = jest.fn();
const mockRecordConsent    = jest.fn();
const mockAuditCreate      = jest.fn();

jest.mock('@/lib/consent', () => ({
  getConsentStatus: (...a: unknown[]) => mockGetConsentStatus(...a),
  recordConsent:    (...a: unknown[]) => mockRecordConsent(...a),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditEvent: { create: (...a: unknown[]) => mockAuditCreate(...a) },
  },
}));

const sampleStatus = {
  termsAndPrivacy: { granted: true, version: 'v1', acceptedAt: new Date('2026-01-01') },
  analytics:       { granted: false, version: '', updatedAt: null, decided: false },
};

function getRequest() {
  return { headers: { get: () => null } } as any;
}
function postRequest(body: unknown) {
  return {
    headers: { get: () => null },
    json: jest.fn(async () => body),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.userId = 'user-1';
  mockGetConsentStatus.mockResolvedValue(sampleStatus);
  mockAuditCreate.mockResolvedValue({});
});

test('GET returns the current consent status for the logged-in user', async () => {
  const { GET } = await import('../../app/api/consent/route');
  const res = await GET();
  const body = await res.json();

  expect(res.status).toBe(200);
  // JSON round-trip serializes Dates to ISO strings.
  expect(body.consent).toEqual({
    ...sampleStatus,
    termsAndPrivacy: { ...sampleStatus.termsAndPrivacy, acceptedAt: sampleStatus.termsAndPrivacy.acceptedAt.toISOString() },
  });
  expect(mockGetConsentStatus).toHaveBeenCalledWith('user-1');
});

test('GET rejects an unauthenticated request with 401', async () => {
  mockSession.isLoggedIn = false;
  const { GET } = await import('../../app/api/consent/route');
  const res = await GET();

  expect(res.status).toBe(401);
  expect(mockGetConsentStatus).not.toHaveBeenCalled();
});

test('POST grants analytics consent, records it, and writes an audit event', async () => {
  const { POST } = await import('../../app/api/consent/route');
  const res = await POST(postRequest({ purpose: 'analytics', granted: true }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(mockRecordConsent).toHaveBeenCalledWith('user-1', 'analytics', true, expect.objectContaining({ source: 'settings' }));
  expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ eventType: 'consent_update' }),
  }));
});

test('POST withdraws analytics consent', async () => {
  const { POST } = await import('../../app/api/consent/route');
  const res = await POST(postRequest({ purpose: 'analytics', granted: false }));

  expect(res.status).toBe(200);
  expect(mockRecordConsent).toHaveBeenCalledWith('user-1', 'analytics', false, expect.objectContaining({ source: 'settings' }));
});

test('POST rejects purpose "terms_and_privacy" with 400 — required consent is not togglable here', async () => {
  const { POST } = await import('../../app/api/consent/route');
  const res = await POST(postRequest({ purpose: 'terms_and_privacy', granted: false }));
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toMatch(/analytics/i);
  expect(mockRecordConsent).not.toHaveBeenCalled();
});

test('POST rejects a non-boolean "granted" with 400', async () => {
  const { POST } = await import('../../app/api/consent/route');
  const res = await POST(postRequest({ purpose: 'analytics', granted: 'yes' }));

  expect(res.status).toBe(400);
  expect(mockRecordConsent).not.toHaveBeenCalled();
});

test('POST rejects an unauthenticated request with 401', async () => {
  mockSession.isLoggedIn = false;
  const { POST } = await import('../../app/api/consent/route');
  const res = await POST(postRequest({ purpose: 'analytics', granted: true }));

  expect(res.status).toBe(401);
  expect(mockRecordConsent).not.toHaveBeenCalled();
});
