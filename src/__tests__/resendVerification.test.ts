// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/auth/resend-verification route behavior.

export {};

const mockSendEmail = jest.fn(async (_args: unknown) => true);
const mockBuildVerificationEmail = jest.fn((_name: string, _email: string, _token: string, _appUrl: string) => ({
  subject: 'Verify your email',
  text: 'Verification text',
  html: '<p>Verification</p>',
}));

jest.mock('@/lib/auth', () => ({
  EMAIL_VERIFICATION_TTL_HOURS: 24,
  generateVerificationToken: jest.fn(() => 'new-verification-token'),
}));
jest.mock('@/lib/email', () => ({
  sendEmail: (args: unknown) => mockSendEmail(args),
  buildVerificationEmail: (name: string, email: string, token: string, appUrl: string) =>
    mockBuildVerificationEmail(name, email, token, appUrl),
}));
jest.mock('@/lib/system-error-logger', () => ({
  safeAuditEvent: jest.fn(async () => {}),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(async () => ({})),
    },
    loginAttempt: {
      count: jest.fn(async () => 0),
      create: jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { POST } from '../../app/api/auth/resend-verification/route';

function request(body: unknown) {
  const url = 'http://localhost/api/auth/resend-verification';
  return {
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return '127.0.0.1';
        if (name === 'host') return 'localhost';
        return null;
      },
    },
    json: jest.fn(async () => body),
    nextUrl: new URL(url),
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('TC-RV-01: resend-verification sends a new link for active unverified users', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'user-1',
    name: 'Sam',
    email: 'sam@test.com',
    isActive: true,
    emailVerified: false,
  });

  const res = await POST(request({ email: 'sam@test.com' }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'user-1' },
    data: expect.objectContaining({
      emailVerificationToken: 'new-verification-token',
      emailVerificationExpires: expect.any(Date),
    }),
  }));
  expect(mockBuildVerificationEmail).toHaveBeenCalledWith('Sam', 'sam@test.com', 'new-verification-token', 'http://localhost');
  expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'sam@test.com' }));
});

test('TC-RV-02: resend-verification does not send for unknown users', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

  const res = await POST(request({ email: 'ghost@test.com' }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.ok).toBe(true);
  expect(prisma.user.update).not.toHaveBeenCalled();
  expect(mockSendEmail).not.toHaveBeenCalled();
});
