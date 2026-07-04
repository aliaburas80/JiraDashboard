// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Member directory tests — TC-MD-05 to TC-MD-08.

import { matchesMemberQuery, contactEmailFor } from '../lib/members';

const mockSession: { isLoggedIn: boolean; role: string; userId: string; email: string; name: string } = {
  isLoggedIn: true,
  role: 'scrum_master',
  userId: 'user-1',
  email: 'sam@test.com',
  name: 'Sam',
};

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn() },
  },
}));
jest.mock('@/services/storage/cloudSync', () => ({
  syncFromCloud: jest.fn(async () => ({ status: 'cache-hit' })),
}));

function dbUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Ana Active',
    email: 'ana@test.com',
    role: 'scrum_master',
    avatarUrl: null,
    position: 'Scrum Master',
    phone: null,
    contactEmail: null,
    address: null,
    certificates: null,
    bio: 'Loves retros.',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession.isLoggedIn = true;
});

// TC-MD-05 — GET /api/members returns only active users sorted by name

test('TC-MD-05: members API queries only active users ordered by name ascending', async () => {
  const { prisma } = await import('@/lib/prisma');
  (prisma.user.findMany as jest.Mock).mockResolvedValue([dbUser()]);
  const { GET } = await import('../../app/api/members/route');

  const response = await GET();
  const body = await response.json();

  expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { isActive: true },
    orderBy: [{ name: 'asc' }],
  }));
  expect(response.status).toBe(200);
  expect(body.members).toHaveLength(1);
  expect(body.members[0].name).toBe('Ana Active');
});

test('TC-MD-08: members API rejects anonymous requests with 401 (drives client redirect to /login)', async () => {
  mockSession.isLoggedIn = false;
  const { prisma } = await import('@/lib/prisma');
  const { GET } = await import('../../app/api/members/route');

  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(401);
  expect(body.error).toBe('Not authenticated.');
  expect(prisma.user.findMany).not.toHaveBeenCalled();
});

// TC-MD-06 / TC-MD-07 — directory page search filter and contact-email fallback

function member(overrides: Record<string, unknown> = {}) {
  return {
    id: 'm-1',
    name: 'Marcus Lee',
    email: 'marcus@test.com',
    role: 'product_owner',
    roleLabel: 'Product Owner',
    avatarUrl: '',
    position: 'Product Owner',
    phone: '',
    contactEmail: '',
    address: '',
    certificates: '',
    bio: 'Ships outcomes, not output.',
    ...overrides,
  };
}

test('TC-MD-06: search query matches across name, email, position, role label, and bio', () => {
  const m = member();

  expect(matchesMemberQuery(m, '')).toBe(true);
  expect(matchesMemberQuery(m, 'marcus')).toBe(true);
  expect(matchesMemberQuery(m, 'MARCUS@TEST.COM')).toBe(true);
  expect(matchesMemberQuery(m, 'product owner')).toBe(true);
  expect(matchesMemberQuery(m, 'ships outcomes')).toBe(true);
  expect(matchesMemberQuery(m, 'no-such-text')).toBe(false);
});

test('TC-MD-07: contactEmailFor falls back to account email when contactEmail is empty', () => {
  expect(contactEmailFor(member({ contactEmail: '' }))).toBe('marcus@test.com');
  expect(contactEmailFor(member({ contactEmail: 'marcus.lee@external.example' })))
    .toBe('marcus.lee@external.example');
});
