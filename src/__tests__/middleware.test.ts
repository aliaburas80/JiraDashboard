// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Route-protection middleware tests — TC-PW-07 (forced password-change redirect),
// TC-A-10 (unauthenticated redirect to /login, added 2026-06-08 to close
// TRACE-02 / Gaps Summary COVER-11 — see TODO-List.md Section 8 / product/TEST_CASES.md §F3).

import { NextRequest } from 'next/server';

const mockSession: { isLoggedIn: boolean; role: string; mustChangePassword: boolean } = {
  isLoggedIn: true,
  role: 'scrum_master',
  mustChangePassword: false,
};

jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/roles', () => ({
  canAccessRoute: jest.fn(() => true),
  fallbackRouteForRole: jest.fn(() => '/dashboard'),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
  mockSession.role = 'scrum_master';
  mockSession.mustChangePassword = false;
});

function reqFor(pathname: string) {
  return new NextRequest(`http://localhost:3000${pathname}`);
}

test('TC-PW-07a: middleware redirects every protected route to /change-password while mustChangePassword is true', async () => {
  mockSession.mustChangePassword = true;
  const { proxy: middleware } = await import('../../proxy');

  for (const pathname of ['/dashboard', '/admin/settings', '/members', '/profile']) {
    const response = await middleware(reqFor(pathname));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`http://localhost:3000/change-password`);
  }
});

test('TC-PW-07b: middleware does not redirect-loop on /change-password itself while mustChangePassword is true', async () => {
  mockSession.mustChangePassword = true;
  const { proxy: middleware } = await import('../../proxy');

  const response = await middleware(reqFor('/change-password'));

  expect(response.status).not.toBe(307);
  expect(response.headers.get('location')).toBeNull();
});

test('TC-PW-07c: middleware does not redirect to /change-password when mustChangePassword is false', async () => {
  mockSession.mustChangePassword = false;
  const { proxy: middleware } = await import('../../proxy');

  const response = await middleware(reqFor('/dashboard'));

  expect(response.headers.get('location')).not.toBe('http://localhost:3000/change-password');
});

test('TC-A-10: middleware redirects an unauthenticated request on a protected route to /login?redirect=<path>', async () => {
  mockSession.isLoggedIn = false;
  const { proxy: middleware } = await import('../../proxy');

  const response = await middleware(reqFor('/dashboard'));

  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fdashboard');
});

// SEC (2026-07-18, docs/product-audit/10-technical-cleanup.md Part 1 finding
// 1): /api/* defense-in-depth backstop tests.
describe('SEC-2026-07-18: /api/* backstop', () => {
  test('a non-public API route with no session is rejected with 401 JSON, not a redirect', async () => {
    mockSession.isLoggedIn = false;
    const { proxy: middleware } = await import('../../proxy');

    const response = await middleware(reqFor('/api/imports'));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Not authenticated.');
  });

  test('a non-public API route with a valid session passes through', async () => {
    mockSession.isLoggedIn = true;
    const { proxy: middleware } = await import('../../proxy');

    const response = await middleware(reqFor('/api/imports'));

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(307);
  });

  test.each([
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/resend-verification',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/health',
    '/api/ready',
    '/api/demo-request',
    '/api/events/error',
    '/api/dashboard',
    '/api/backend-view',
  ])('public API route %s remains reachable with no session', async (pathname) => {
    mockSession.isLoggedIn = false;
    const { proxy: middleware } = await import('../../proxy');

    const response = await middleware(reqFor(pathname));

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(307);
  });

  test('an admin-only API route still passes the backstop on session alone — role enforcement stays the route\'s own job', async () => {
    // The backstop only checks "is there a valid session," never role — this
    // proves it does not itself 403 a non-admin, so it cannot conflict with
    // (or duplicate) each admin route's own requireAdmin() check.
    mockSession.isLoggedIn = true;
    mockSession.role = 'scrum_master';
    const { proxy: middleware } = await import('../../proxy');

    const response = await middleware(reqFor('/api/admin/users'));

    expect(response.status).not.toBe(401);
  });
});

// P0A-07: per-request correlation ID — proxy.ts mints/forwards x-request-id
// for every /api/* request so safeAuditEvent()/logSystemError() calls can be
// tied back to the request that produced them.
describe('P0A-07: /api/* correlation ID', () => {
  test('a fresh UUID is set on the response when no inbound x-request-id was sent', async () => {
    mockSession.isLoggedIn = true;
    const { proxy: middleware } = await import('../../proxy');

    const response = await middleware(reqFor('/api/imports'));

    expect(response.headers.get('x-request-id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  test('an inbound x-request-id (e.g. set by an upstream load balancer) is preserved, not overwritten', async () => {
    mockSession.isLoggedIn = true;
    const { proxy: middleware } = await import('../../proxy');

    const req = new NextRequest('http://localhost:3000/api/imports', {
      headers: { 'x-request-id': 'upstream-id-123' },
    });
    const response = await middleware(req);

    expect(response.headers.get('x-request-id')).toBe('upstream-id-123');
  });

  test('a public API route also gets a correlation ID on its response', async () => {
    mockSession.isLoggedIn = false;
    const { proxy: middleware } = await import('../../proxy');

    const response = await middleware(reqFor('/api/health'));

    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  test('a rejected (401) request still carries a correlation ID on the response', async () => {
    mockSession.isLoggedIn = false;
    const { proxy: middleware } = await import('../../proxy');

    const response = await middleware(reqFor('/api/imports'));

    expect(response.status).toBe(401);
    expect(response.headers.get('x-request-id')).toBeTruthy();
  });

  test('the request-id is forwarded to the downstream route handler, not just the response', async () => {
    mockSession.isLoggedIn = true;
    const { proxy: middleware } = await import('../../proxy');

    const response = await middleware(reqFor('/api/health'));

    // Next.js encodes a NextResponse.next({ request: { headers } }) header
    // mutation via these internal response headers (verified directly against
    // the installed next@16.2.11's own response.js) — this is how the
    // forwarded request header actually reaches the route handler. This is an
    // internal-but-currently-stable encoding, not part of Next's public API —
    // treat this assertion as a "does the wiring work today" smoke test, not
    // a guarantee that survives every future Next major version.
    expect(response.headers.get('x-middleware-override-headers')).toContain('x-request-id');
    expect(response.headers.get('x-middleware-request-x-request-id')).toBeTruthy();
  });
});
