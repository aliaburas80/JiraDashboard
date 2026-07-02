// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-010: Session hardening tests — TC-SH-01 to TC-SH-04
// Verifies that /api/auth/me ejects suspended users mid-session
// rather than trusting the cookie indefinitely.

export {};

const mockSession = {
  isLoggedIn: true,
  userId: 'user-active',
  email: 'user@test.com',
  name: 'Alice',
  role: 'user',
  mustChangePassword: false,
  destroy: jest.fn(),
  save: jest.fn(),
};

const mockFindUnique = jest.fn();

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => mockFindUnique(...a) },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn         = true;
  mockSession.userId             = 'user-active';
  mockSession.mustChangePassword = false;
  mockSession.destroy            = jest.fn();
});

// ── TC-SH-01: Active user gets their session data ─────────────────────────────

test('TC-SH-01: GET /api/auth/me returns user data when account is active', async () => {
  mockFindUnique.mockResolvedValueOnce({ isActive: true, role: 'user', mustChangePassword: false });

  const { GET } = await import('../../app/api/auth/me/route');
  const res  = await GET();
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.userId).toBe('user-active');
  expect(body.email).toBe('user@test.com');
  expect(mockSession.destroy).not.toHaveBeenCalled();
});

// ── TC-SH-02: Suspended user is ejected mid-session ──────────────────────────

test('TC-SH-02: GET /api/auth/me returns 401 and destroys session when user is suspended', async () => {
  // Admin suspended the user AFTER they logged in — isActive is now false in DB
  mockFindUnique.mockResolvedValueOnce({ isActive: false, role: 'user', mustChangePassword: false });

  const { GET } = await import('../../app/api/auth/me/route');
  const res  = await GET();
  const body = await res.json();

  expect(res.status).toBe(401);
  expect(body.error).toMatch(/suspended/i);
  // Session must be destroyed so the cookie no longer works
  expect(mockSession.destroy).toHaveBeenCalledTimes(1);
});

// ── TC-SH-03: Deleted user account is ejected mid-session ────────────────────

test('TC-SH-03: GET /api/auth/me returns 401 when user account no longer exists in DB', async () => {
  // User row was deleted while cookie was still valid
  mockFindUnique.mockResolvedValueOnce(null);

  const { GET } = await import('../../app/api/auth/me/route');
  const res  = await GET();
  const body = await res.json();

  expect(res.status).toBe(401);
  expect(body.error).toMatch(/suspended|no longer exists/i);
  expect(mockSession.destroy).toHaveBeenCalledTimes(1);
});

// ── TC-SH-04: DB failure falls back to cookie (availability over strict security) ─

test('TC-SH-04: GET /api/auth/me falls back to cookie when DB is temporarily unavailable', async () => {
  // DB is down — findUnique throws
  mockFindUnique.mockRejectedValueOnce(new Error('DB connection timeout'));

  const { GET } = await import('../../app/api/auth/me/route');
  const res  = await GET();
  const body = await res.json();

  // Cookie is still valid — return session data rather than blocking all users
  expect(res.status).toBe(200);
  expect(body.userId).toBe('user-active');
  // Session should NOT be destroyed on a transient DB error
  expect(mockSession.destroy).not.toHaveBeenCalled();
});

// ── TC-SH-05: Unauthenticated request returns 401 without touching DB ─────────

test('TC-SH-05: GET /api/auth/me returns 401 without DB call when cookie has no session', async () => {
  mockSession.isLoggedIn = false;

  const { GET } = await import('../../app/api/auth/me/route');
  const res  = await GET();

  expect(res.status).toBe(401);
  // DB should never be queried for unauthenticated requests (saves latency)
  expect(mockFindUnique).not.toHaveBeenCalled();
  expect(mockSession.destroy).not.toHaveBeenCalled();
});
