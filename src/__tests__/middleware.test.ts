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
