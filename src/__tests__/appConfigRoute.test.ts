// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Regression test for PUT /api/admin/app-config (2026-07-04): saving with the
// password field left blank (the normal case when only editing "From address")
// used to pass `undefined` as the password to saveSmtpSettings(), which threw
// "password required" on a first-ever save (no existing DB row) — silently
// swallowed, so the DB row was never created and the saved value never stuck.

export {};

const mockSession = { isLoggedIn: true, role: 'admin', userId: 'admin-1', email: 'admin@test.com' };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({ getIronSession: jest.fn(async () => mockSession) }));
jest.mock('@/lib/prisma', () => ({ prisma: { auditEvent: { create: jest.fn(async () => ({})) } } }));

const mockSaveSmtpSettings = jest.fn(async (_input: unknown) => ({}));
jest.mock('@/services/smtp/smtpSettings.service', () => ({
  saveSmtpSettings: (arg: unknown) => mockSaveSmtpSettings(arg),
}));

jest.mock('@/lib/app-config', () => ({
  getAppConfig: jest.fn(async () => ({
    smtp: { host: 'smtp.gmail.com', port: 587, user: 'aliaburas80@gmail.com', pass: 'currently-effective-password', from: 'Delivery Clarity <aliaburas80@gmail.com>' },
    jira: { apiToken: '' },
    appUrl: 'https://deliveryclarity.app',
  })),
  saveToCloud: jest.fn(async () => {}),
  invalidateConfig: jest.fn(),
}));

function request(body: unknown) {
  return { json: jest.fn(async () => body) } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CONFIG_ENCRYPTION_KEY = 'test-key';
});

test('TC-CFGR-01: saving with a blank password field passes the effective existing password, not undefined', async () => {
  const { PUT } = await import('../../app/api/admin/app-config/route');
  const res = await PUT(request({
    smtp: { host: 'smtp.gmail.com', port: 587, user: 'aliaburas80@gmail.com', pass: '', from: 'Delivery Clarity <noreply@deliveryclarity.app>' },
    appUrl: 'https://deliveryclarity.app',
  }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(body.dbSaveError).toBeUndefined();
  expect(mockSaveSmtpSettings).toHaveBeenCalledWith(expect.objectContaining({
    pass: 'currently-effective-password',
    fromAddress: 'Delivery Clarity <noreply@deliveryclarity.app>',
  }));
});

test('TC-CFGR-02: a genuine DB save failure is surfaced as dbSaveError instead of a silent { ok: true }', async () => {
  mockSaveSmtpSettings.mockRejectedValueOnce(new Error('Connection to database failed.'));

  const { PUT } = await import('../../app/api/admin/app-config/route');
  const res = await PUT(request({
    smtp: { host: 'smtp.gmail.com', port: 587, user: 'aliaburas80@gmail.com', pass: '', from: 'Delivery Clarity <noreply@deliveryclarity.app>' },
  }));
  const body = await res.json();

  expect(body.ok).toBe(true); // cloud save can still have succeeded
  expect(body.dbSaveError).toBe('Connection to database failed.');
});
