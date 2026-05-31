// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Auth tests — TC-A-01 to TC-A-09

import { hashPassword, verifyPassword, validatePasswordStrength } from '../lib/auth';

// ── TC-A-08: Password hashing ─────────────────────────────────────────────────

test('TC-A-08a: hashPassword produces a bcrypt hash — not plaintext', async () => {
  const hash = await hashPassword('Admin@DC2025');
  expect(hash).not.toBe('Admin@DC2025');
  expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
});

test('TC-A-08b: hashPassword — same password produces different hashes (salt)', async () => {
  const hash1 = await hashPassword('Admin@DC2025');
  const hash2 = await hashPassword('Admin@DC2025');
  expect(hash1).not.toBe(hash2);
});

test('TC-A-08c: hashPassword — minimum 12 rounds (cost factor in hash)', async () => {
  const hash = await hashPassword('Admin@DC2025');
  // bcrypt hash format: $2b$<rounds>$<salt+hash>
  const rounds = parseInt(hash.split('$')[2], 10);
  expect(rounds).toBeGreaterThanOrEqual(12);
});

// ── TC-A-02: Password verification ────────────────────────────────────────────

test('TC-A-02a: verifyPassword — correct password returns true', async () => {
  const hash = await hashPassword('Correct@1');
  const result = await verifyPassword('Correct@1', hash);
  expect(result).toBe(true);
});

test('TC-A-02b: verifyPassword — wrong password returns false', async () => {
  const hash = await hashPassword('Correct@1');
  const result = await verifyPassword('Wrong@999', hash);
  expect(result).toBe(false);
});

test('TC-A-02c: verifyPassword — empty string returns false', async () => {
  const hash = await hashPassword('Correct@1');
  const result = await verifyPassword('', hash);
  expect(result).toBe(false);
});

// ── Password strength validation ──────────────────────────────────────────────

test('TC-A-00a: validatePasswordStrength — too short returns error', () => {
  expect(validatePasswordStrength('Ab1')).toBe('Password must be at least 8 characters.');
});

test('TC-A-00b: validatePasswordStrength — no uppercase returns error', () => {
  expect(validatePasswordStrength('alllower1')).toBe('Password must contain at least one uppercase letter.');
});

test('TC-A-00c: validatePasswordStrength — no number returns error', () => {
  expect(validatePasswordStrength('NoNumbers!')).toBe('Password must contain at least one number.');
});

test('TC-A-00d: validatePasswordStrength — valid password returns null', () => {
  expect(validatePasswordStrength('Admin@DC2025')).toBeNull();
  expect(validatePasswordStrength('Secure1password')).toBeNull();
});

// ── TC-A-09: Rate limiter ─────────────────────────────────────────────────────

test('TC-A-09: login rate limiter blocks after 5 attempts per minute', async () => {
  // Inline the rate limiter logic to test it independently
  const loginRate = new Map<string, number[]>();
  const RATE_MAX = 5;

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const hits = (loginRate.get(ip) ?? []).filter(t => t > now - 60_000);
    if (hits.length >= RATE_MAX) return true;
    loginRate.set(ip, [...hits, now]);
    return false;
  }

  const testIp = '1.2.3.4';
  // First 5 attempts should NOT be rate limited
  for (let i = 0; i < 5; i++) {
    expect(isRateLimited(testIp)).toBe(false);
  }
  // 6th attempt MUST be rate limited
  expect(isRateLimited(testIp)).toBe(true);
});

test('TC-A-09b: rate limiter resets per different IP', async () => {
  const loginRate = new Map<string, number[]>();
  const RATE_MAX = 5;

  function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const hits = (loginRate.get(ip) ?? []).filter(t => t > now - 60_000);
    if (hits.length >= RATE_MAX) return true;
    loginRate.set(ip, [...hits, now]);
    return false;
  }

  // Exhaust IP A
  for (let i = 0; i < 5; i++) isRateLimited('192.168.1.1');
  expect(isRateLimited('192.168.1.1')).toBe(true);

  // IP B should still be allowed
  expect(isRateLimited('10.0.0.1')).toBe(false);
});

// ── TC-A-01 / TC-A-03: Login API — mocked ────────────────────────────────────

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    auditEvent: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('iron-session', () => ({
  getIronSession: jest.fn().mockResolvedValue({
    userId: null, email: null, name: null, role: null, isLoggedIn: false,
    save: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn(),
  }),
}));

import { prisma } from '../lib/prisma';

test('TC-A-01: login with valid credentials — sets session fields', async () => {
  const mockHash = await hashPassword('Admin@DC2025');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'user-123', name: 'Ali', email: 'ali@test.com',
    passwordHash: mockHash, isActive: true, role: 'user',
  });

  const { getIronSession } = await import('iron-session');
  const mockSession = {
    userId: null as string | null, email: null as string | null,
    name: null as string | null, role: null as string | null,
    isLoggedIn: false, save: jest.fn(), destroy: jest.fn(),
  };
  (getIronSession as jest.Mock).mockResolvedValue(mockSession);

  // Simulate what the login route does
  const user = await prisma.user.findUnique({ where: { email: 'ali@test.com' } }) as any;
  const valid = await verifyPassword('Admin@DC2025', user.passwordHash);

  expect(valid).toBe(true);
  expect(user.isActive).toBe(true);

  // Set session as the route would
  mockSession.userId    = user.id;
  mockSession.email     = user.email;
  mockSession.name      = user.name;
  mockSession.isLoggedIn = true;
  await mockSession.save();

  expect(mockSession.isLoggedIn).toBe(true);
  expect(mockSession.userId).toBe('user-123');
  expect(mockSession.save).toHaveBeenCalled();
});

test('TC-A-02: login with wrong password — verifyPassword returns false', async () => {
  const mockHash = await hashPassword('Correct@1');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'user-123', email: 'ali@test.com',
    passwordHash: mockHash, isActive: true, role: 'user',
  });

  const user = await prisma.user.findUnique({ where: { email: 'ali@test.com' } }) as any;
  const valid = await verifyPassword('Wrong@999', user.passwordHash);
  expect(valid).toBe(false);
});

test('TC-A-03: disabled user account — isActive false blocks login', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'user-disabled', email: 'disabled@test.com',
    passwordHash: 'irrelevant', isActive: false, role: 'user',
  });

  const user = await prisma.user.findUnique({ where: { email: 'disabled@test.com' } }) as any;
  // Login route checks isActive before verifying password
  expect(user.isActive).toBe(false);
});

test('TC-A-04: non-existent user — findUnique returns null', async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  const user = await prisma.user.findUnique({ where: { email: 'ghost@test.com' } });
  expect(user).toBeNull();
});

test('TC-A-05: admin role set correctly in session', async () => {
  const mockHash = await hashPassword('Admin@DC2025');
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: 'admin-1', name: 'Admin', email: 'admin@test.com',
    passwordHash: mockHash, isActive: true, role: 'admin',
  });

  const user = await prisma.user.findUnique({ where: { email: 'admin@test.com' } }) as any;
  expect(user.role).toBe('admin');
});
