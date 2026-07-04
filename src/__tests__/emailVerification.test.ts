// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-012 email verification — TC-EV-01 to TC-EV-07

import { generateVerificationToken, EMAIL_VERIFICATION_TTL_HOURS } from '../lib/auth';
import { buildVerificationEmail } from '../lib/email';

// ── Token generation ──────────────────────────────────────────────────────────

test('TC-EV-01: generateVerificationToken produces a 64-character hex string', () => {
  const token = generateVerificationToken();
  expect(token).toMatch(/^[0-9a-f]{64}$/);
});

test('TC-EV-02: generateVerificationToken produces different tokens on each call', () => {
  const a = generateVerificationToken();
  const b = generateVerificationToken();
  expect(a).not.toBe(b);
});

test('TC-EV-03: EMAIL_VERIFICATION_TTL_HOURS is a positive number', () => {
  expect(EMAIL_VERIFICATION_TTL_HOURS).toBeGreaterThan(0);
});

// ── Verification email content ────────────────────────────────────────────────

test('TC-EV-04: buildVerificationEmail embeds the token in a /verify-email link', () => {
  const email = buildVerificationEmail('Ali', 'ali@test.com', 'abc123token', 'https://app.example.com');
  expect(email.text).toContain('https://app.example.com/verify-email?token=abc123token');
  expect(email.html).toContain('https://app.example.com/verify-email?token=abc123token');
});

test('TC-EV-05: buildVerificationEmail mentions the recipient name and 24-hour expiry', () => {
  const email = buildVerificationEmail('Ali', 'ali@test.com', 'tok', 'https://app.example.com');
  expect(email.text).toContain('Ali');
  expect(email.text.toLowerCase()).toContain('24 hours');
});

// ── POST /api/auth/verify-email route logic ───────────────────────────────────

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update:     jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('../lib/system-error-logger', () => ({
  safeAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

import { prisma } from '../lib/prisma';
import { POST } from '../../app/api/auth/verify-email/route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/verify-email', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

test('TC-EV-06: valid, unexpired token verifies the user and clears the token', async () => {
  const future = new Date(Date.now() + 60_000);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'u1', email: 'ali@test.com', emailVerified: false, emailVerificationExpires: future,
  });

  const res  = await POST(makeRequest({ token: 'valid-token' }) as any);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.ok).toBe(true);
  expect(data.alreadyVerified).toBe(false);
  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: 'u1' },
    data:  { emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
  });
});

test('TC-EV-07: expired token is rejected without verifying', async () => {
  const past = new Date(Date.now() - 60_000);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'u2', email: 'bob@test.com', emailVerified: false, emailVerificationExpires: past,
  });
  (prisma.user.update as jest.Mock).mockClear();

  const res  = await POST(makeRequest({ token: 'expired-token' }) as any);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toMatch(/expired/i);
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test('TC-EV-08: unknown token returns an error', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

  const res  = await POST(makeRequest({ token: 'unknown-token' }) as any);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toMatch(/invalid|already been used/i);
});

test('TC-EV-09: already-verified user short-circuits as success without re-updating', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'u3', email: 'done@test.com', emailVerified: true, emailVerificationExpires: null,
  });
  (prisma.user.update as jest.Mock).mockClear();

  const res  = await POST(makeRequest({ token: 'already-used' }) as any);
  const data = await res.json();

  expect(res.status).toBe(200);
  expect(data.alreadyVerified).toBe(true);
  expect(prisma.user.update).not.toHaveBeenCalled();
});

test('TC-EV-10: missing token returns 400', async () => {
  const res  = await POST(makeRequest({}) as any);
  const data = await res.json();

  expect(res.status).toBe(400);
  expect(data.error).toMatch(/required/i);
});
