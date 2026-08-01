// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-09: GET /api/admin/feedback (list) and GET /api/admin/feedback/[id]/screenshot.
// The list route must never ship raw screenshotData in bulk — only a
// hasScreenshot boolean; the full image is fetched lazily, one at a time,
// via the [id]/screenshot sub-route (see app/api/admin/feedback/route.ts and
// app/api/admin/feedback/[id]/screenshot/route.ts for the reasoning).

export {};

let mockSession: { isLoggedIn: boolean; role?: string; userId?: string } = { isLoggedIn: true, role: 'admin', userId: 'admin-1' };

jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => mockSession),
}));

const mockFindMany   = jest.fn();
const mockCount      = jest.fn();
const mockGroupBy    = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    feedback: {
      findMany:   (...a: unknown[]) => mockFindMany(...a),
      count:      (...a: unknown[]) => mockCount(...a),
      groupBy:    (...a: unknown[]) => mockGroupBy(...a),
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
    },
  },
}));

function nextRequest(url: string) {
  return { headers: { get: () => null }, nextUrl: new URL(url), url } as any;
}

function feedbackRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fb-1', category: 'Suggestion', message: 'Great app', impactLevel: 'Minor',
    canContact: false, page: '/', appVersion: '1.0.0', browserFamily: 'Chrome',
    status: 'New', statusNote: null, userId: null, userEmail: null,
    createdAt: new Date('2026-08-01'), screenshotData: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = { isLoggedIn: true, role: 'admin', userId: 'admin-1' };
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
  mockGroupBy.mockResolvedValue([]);
  mockFindUnique.mockResolvedValue(null);
});

describe('GET /api/admin/feedback', () => {
  test('list items never include raw screenshotData, but do include a hasScreenshot flag', async () => {
    mockFindMany.mockResolvedValue([
      feedbackRow({ id: 'fb-1', screenshotData: `data:image/jpeg;base64,${'A'.repeat(500)}` }),
      feedbackRow({ id: 'fb-2', screenshotData: null }),
    ]);
    const { GET } = await import('../../app/api/admin/feedback/route');
    const res = await GET(nextRequest('http://localhost/api/admin/feedback'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(JSON.stringify(body)).not.toContain('base64');
    expect(body.items[0]).toEqual(expect.objectContaining({ id: 'fb-1', hasScreenshot: true }));
    expect(body.items[0].screenshotData).toBeUndefined();
    expect(body.items[1]).toEqual(expect.objectContaining({ id: 'fb-2', hasScreenshot: false }));
  });

  test('rejects a non-admin session with 403', async () => {
    mockSession = { isLoggedIn: true, role: 'scrum_master', userId: 'user-1' };
    const { GET } = await import('../../app/api/admin/feedback/route');
    const res = await GET(nextRequest('http://localhost/api/admin/feedback'));

    expect(res.status).toBe(403);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/feedback/[id]/screenshot', () => {
  function params(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  test('returns the stored screenshot for an admin', async () => {
    mockFindUnique.mockResolvedValue({ screenshotData: 'data:image/jpeg;base64,AAA' });
    const { GET } = await import('../../app/api/admin/feedback/[id]/screenshot/route');
    const res = await GET({} as any, params('fb-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.screenshot).toBe('data:image/jpeg;base64,AAA');
  });

  test('returns 404 when the feedback item has no screenshot', async () => {
    mockFindUnique.mockResolvedValue({ screenshotData: null });
    const { GET } = await import('../../app/api/admin/feedback/[id]/screenshot/route');
    const res = await GET({} as any, params('fb-1'));

    expect(res.status).toBe(404);
  });

  test('rejects a non-admin session with 403 before querying the database', async () => {
    mockSession = { isLoggedIn: true, role: 'scrum_master', userId: 'user-1' };
    const { GET } = await import('../../app/api/admin/feedback/[id]/screenshot/route');
    const res = await GET({} as any, params('fb-1'));

    expect(res.status).toBe(403);
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});
