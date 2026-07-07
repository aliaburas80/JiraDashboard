// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-013 forgot/reset password — TC-PR-01 to TC-PR-12

import { PASSWORD_RESET_TTL_HOURS } from '../lib/auth';
import { buildPasswordResetEmail } from '../lib/email';

test('TC-PR-01: PASSWORD_RESET_TTL_HOURS is short-lived (1 hour) and shorter than email verification (24h)', () => {
  expect(PASSWORD_RESET_TTL_HOURS).toBe(1);
});

test('TC-PR-02: buildPasswordResetEmail embeds the token in a /reset-password link', () => {
  const email = buildPasswordResetEmail('Ali', 'reset-token-abc', 'https://app.example.com');
  expect(email.text).toContain('https://app.example.com/reset-password?token=reset-token-abc');
  expect(email.html).toContain('https://app.example.com/reset-password?token=reset-token-abc');
});

test('TC-PR-03: buildPasswordResetEmail mentions the recipient name and 1-hour expiry', () => {
  const email = buildPasswordResetEmail('Ali', 'tok', 'https://app.example.com');
  expect(email.text).toContain('Ali');
  expect(email.text.toLowerCase()).toContain('1 hour');
});

// ── POST /api/auth/forgot-password route logic ────────────────────────────────

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update:     jest.fn().mockResolvedValue({}),
    },
    loginAttempt: {
      count:      jest.fn().mockResolvedValue(0),
      create:     jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

jest.mock('../lib/system-error-logger', () => ({
  safeAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../lib/email', () => ({
  ...jest.requireActual('../lib/email'),
  sendEmail: jest.fn().mockResolvedValue(true),
}));

import { prisma } from '../lib/prisma';
import { sendEmail } from '../lib/email';
import { POST as forgotPassword } from '../../app/api/auth/forgot-password/route';
import { POST as resetPassword } from '../../app/api/auth/reset-password/route';

// Route handlers receive a NextRequest, which additionally exposes `.nextUrl` (used by
// resolveRequestOrigin). A plain Request lacks that, so attach it — safe since Request
// instances are ordinary extensible objects and the route casts `as any` at the call site.
function makeRequest(url: string, body: unknown): Request {
  const req = new Request(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  Object.assign(req, { nextUrl: new URL(url) });
  return req;
}

const FORGOT_URL = 'http://localhost/api/auth/forgot-password';
const RESET_URL  = 'http://localhost/api/auth/reset-password';

beforeEach(() => jest.clearAllMocks());

test('TC-PR-04: forgot-password for an existing active user generates a token and sends email', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'u1', email: 'ali@test.com', name: 'Ali', isActive: true,
  });

  const res  = await forgotPassword(makeRequest(FORGOT_URL, { email: 'ali@test.com' }) as any);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.ok).toBe(true);
  expect(prisma.user.update).toHaveBeenCalled();
  expect(sendEmail).toHaveBeenCalled();
});

test('TC-PR-05: forgot-password for a non-existent email returns the same generic response (no enumeration)', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

  const resKnown   = await forgotPassword(makeRequest(FORGOT_URL, { email: 'ghost@test.com' }) as any);
  const dataKnown  = await resKnown.json();

  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', email: 'ali@test.com', name: 'Ali', isActive: true });
  const resExists  = await forgotPassword(makeRequest(FORGOT_URL, { email: 'ali@test.com' }) as any);
  const dataExists = await resExists.json();

  expect(resKnown.status).toBe(200);
  expect(resExists.status).toBe(200);
  expect(dataKnown).toEqual(dataExists);
});

test('TC-PR-06: forgot-password for an inactive (deactivated) account does not send a reset email', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'u1', email: 'ali@test.com', name: 'Ali', isActive: false,
  });

  const res = await forgotPassword(makeRequest(FORGOT_URL, { email: 'ali@test.com' }) as any);
  expect(res.status).toBe(200);
  expect(sendEmail).not.toHaveBeenCalled();
});

test('TC-PR-07: forgot-password rejects an invalid email format', async () => {
  const res  = await forgotPassword(makeRequest(FORGOT_URL, { email: 'not-an-email' }) as any);
  const data = await res.json();
  expect(res.status).toBe(400);
  expect(data.error).toMatch(/valid email/i);
});

test('TC-PR-08: forgot-password is rate limited after 5 requests from the same IP', async () => {
  (prisma.loginAttempt.count as jest.Mock).mockResolvedValue(5);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', email: 'ali@test.com', name: 'Ali', isActive: true });

  const res  = await forgotPassword(makeRequest(FORGOT_URL, { email: 'ali@test.com' }) as any);
  const data = await res.json();
  expect(res.status).toBe(429);
  expect(data.error).toMatch(/too many/i);
});

test('TC-PR-09: reset-password with a valid, unexpired token sets a new password and clears the token', async () => {
  const future = new Date(Date.now() + 60_000);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'u1', email: 'ali@test.com', name: 'Ali', passwordResetExpires: future,
  });

  const res  = await resetPassword(makeRequest(RESET_URL, { token: 'valid-token', newPassword: 'NewPass1' }) as any);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.ok).toBe(true);
  const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
  expect(updateCall.where).toEqual({ id: 'u1' });
  expect(updateCall.data.passwordResetToken).toBeNull();
  expect(updateCall.data.passwordResetExpires).toBeNull();
  expect(updateCall.data.mustChangePassword).toBe(false);
  expect(typeof updateCall.data.passwordHash).toBe('string');
  expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
    to: 'ali@test.com',
    subject: 'Your Delivery Clarity password was changed',
  }));
});

test('TC-PR-10: reset-password rejects an expired token without changing the password', async () => {
  const past = new Date(Date.now() - 60_000);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'u2', email: 'bob@test.com', passwordResetExpires: past,
  });
  (prisma.user.update as jest.Mock).mockClear();

  const res  = await resetPassword(makeRequest(RESET_URL, { token: 'expired-token', newPassword: 'NewPass1' }) as any);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toMatch(/expired/i);
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test('TC-PR-11: reset-password rejects an unknown token', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

  const res  = await resetPassword(makeRequest(RESET_URL, { token: 'unknown-token', newPassword: 'NewPass1' }) as any);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toMatch(/invalid|already been used/i);
});

test('TC-PR-12: reset-password rejects a weak new password before even checking the token', async () => {
  const res  = await resetPassword(makeRequest(RESET_URL, { token: 'some-token', newPassword: 'weak' }) as any);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toMatch(/password/i);
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
});
