// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Route-protection middleware tests — TC-PW-07 (forced password-change redirect).

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
  const { middleware } = await import('../../middleware');

  for (const pathname of ['/dashboard', '/admin/settings', '/members', '/profile']) {
    const response = await middleware(reqFor(pathname));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`http://localhost:3000/change-password`);
  }
});

test('TC-PW-07b: middleware does not redirect-loop on /change-password itself while mustChangePassword is true', async () => {
  mockSession.mustChangePassword = true;
  const { middleware } = await import('../../middleware');

  const response = await middleware(reqFor('/change-password'));

  expect(response.status).not.toBe(307);
  expect(response.headers.get('location')).toBeNull();
});

test('TC-PW-07c: middleware does not redirect to /change-password when mustChangePassword is false', async () => {
  mockSession.mustChangePassword = false;
  const { middleware } = await import('../../middleware');

  const response = await middleware(reqFor('/dashboard'));

  expect(response.headers.get('location')).not.toBe('http://localhost:3000/change-password');
});
