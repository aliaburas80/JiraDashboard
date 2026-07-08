// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0 fix, 2026-07-08: browser localStorage is scoped to the browser, not the
// logged-in account. These tests cover: (1) the shared ownership-tag utility,
// (2) storage.ts refusing to serve another account's cached metrics,
// (3) localImportHistory.ts refusing to serve another account's upload
// history, (4) GET /api/imports and GET /api/metrics no longer falling back
// to an unscoped, unauthenticated, cross-account file store.

export {};

function installBrowserStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  (global as any).window = { dispatchEvent: jest.fn() };
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    constructor(type: string) { this.type = type; }
  };
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: {
      getItem: jest.fn((key: string) => store[key] ?? null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: jest.fn((key: string) => { delete store[key]; }),
      key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
      get length() { return Object.keys(store).length; },
    },
  });
  return store;
}

function mockFetchAsUser(userId: string | null, extraRoutes: Record<string, unknown> = {}) {
  (global as any).fetch = jest.fn(async (url: string) => {
    if (url === '/api/auth/me') {
      return userId
        ? { ok: true, json: async () => ({ userId, email: `${userId}@test.com`, name: userId, role: 'user' }) }
        : { ok: false, json: async () => null };
    }
    if (url in extraRoutes) {
      return { ok: true, json: async () => extraRoutes[url] };
    }
    return { ok: true, json: async () => ({ available: false, message: 'No latest metrics file found on the server.' }) };
  });
}

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  delete (global as any).window;
  delete (global as any).localStorage;
  delete (global as any).CustomEvent;
  delete (global as any).fetch;
});

describe('localDataOwnership — shared ownership-tag utility', () => {
  test('TC-DATAISO-01: setStoredOwner then getStoredOwner round-trips', async () => {
    installBrowserStorage();
    const { setStoredOwner, getStoredOwner } = await import('../lib/localDataOwnership');
    setStoredOwner('k', 'user-a');
    expect(getStoredOwner('k')).toBe('user-a');
  });

  test('TC-DATAISO-02: isOwnedByCurrentUser is true only when the tag matches the live session', async () => {
    installBrowserStorage({ owner_key: 'user-a' });
    mockFetchAsUser('user-a');
    const { isOwnedByCurrentUser } = await import('../lib/localDataOwnership');
    expect(await isOwnedByCurrentUser('owner_key')).toBe(true);
  });

  test('TC-DATAISO-03: isOwnedByCurrentUser is false when the tag belongs to a different account', async () => {
    installBrowserStorage({ owner_key: 'user-a' });
    mockFetchAsUser('user-b');
    const { isOwnedByCurrentUser } = await import('../lib/localDataOwnership');
    expect(await isOwnedByCurrentUser('owner_key')).toBe(false);
  });

  test('TC-DATAISO-04: isOwnedByCurrentUser is false for untagged (legacy, pre-fix) data', async () => {
    installBrowserStorage(); // no owner_key at all
    mockFetchAsUser('user-a');
    const { isOwnedByCurrentUser } = await import('../lib/localDataOwnership');
    expect(await isOwnedByCurrentUser('owner_key')).toBe(false);
  });

  test('TC-DATAISO-05: isOwnedByCurrentUser is false when nobody is logged in', async () => {
    installBrowserStorage({ owner_key: 'user-a' });
    mockFetchAsUser(null);
    const { isOwnedByCurrentUser } = await import('../lib/localDataOwnership');
    expect(await isOwnedByCurrentUser('owner_key')).toBe(false);
  });
});

describe('storage.ts — cross-account localStorage fallback protection', () => {
  test('TC-DATAISO-06: loadMetricsWithSource refuses another account\'s cached metrics and clears it', async () => {
    const store = installBrowserStorage({
      dc_metrics_v2: JSON.stringify({ totalIssues: 99, flow: { items: [] } }),
      dc_metrics_owner_v1: 'user-a',
    });
    mockFetchAsUser('user-b'); // a *different* account is now logged in on this browser

    const { loadMetricsWithSource } = await import('../lib/storage');
    const result = await loadMetricsWithSource();

    expect(result.metrics).toBeNull();
    expect(result.source).toBe('none');
    expect(store.dc_metrics_v2).toBeUndefined();
    expect(store.dc_metrics_owner_v1).toBeUndefined();
  });

  test('TC-DATAISO-07: loadMetricsWithSource still serves the same account\'s own cached metrics', async () => {
    const localMetrics = { totalIssues: 7, flow: { items: [] } };
    installBrowserStorage({
      dc_metrics_v2: JSON.stringify(localMetrics),
      dc_metrics_owner_v1: 'user-a',
    });
    mockFetchAsUser('user-a');

    const { loadMetricsWithSource } = await import('../lib/storage');
    const result = await loadMetricsWithSource();

    expect(result.metrics).toEqual(localMetrics);
    expect(result.source).toBe('localstorage');
  });

  test('TC-DATAISO-08: a server-scoped metrics response is tagged with its owning userId for later validation', async () => {
    const store = installBrowserStorage();
    mockFetchAsUser('user-a', {
      '/api/metrics/latest': { available: true, metrics: { totalIssues: 3 }, userId: 'user-a', savedAt: 'x' },
    });

    const { loadMetricsWithSource } = await import('../lib/storage');
    await loadMetricsWithSource();

    expect(store.dc_metrics_owner_v1).toBe('user-a');
  });

  test('TC-DATAISO-09: clearMetrics removes the owner tag along with the cached data', async () => {
    const store = installBrowserStorage({
      dc_metrics_v2: '{}',
      dc_metrics_source_v1: '{}',
      dc_metrics_owner_v1: 'user-a',
    });
    const { clearMetrics } = await import('../lib/storage');
    clearMetrics();
    expect(store.dc_metrics_v2).toBeUndefined();
    expect(store.dc_metrics_source_v1).toBeUndefined();
    expect(store.dc_metrics_owner_v1).toBeUndefined();
  });

  // P0 fix, 2026-07-08: saveMetrics()'s ownership-tag write used to be
  // fire-and-forget (tagCurrentOwner() was never awaited). A caller that
  // saved fresh upload data and immediately navigated could land on a page
  // whose loadMetricsWithSource() ran isOwnedByCurrentUser() before the tag
  // write had landed — finding no owner tag yet, it concluded the just-saved
  // data was unverified and discarded it (clearMetrics()), so the freshly
  // uploaded sheet vanished and the user was bounced back to '/'. Both tests
  // below use an artificially delayed /api/auth/me mock to prove the race is
  // closed: saveMetrics() must not resolve until the tag write has landed.
  test('TC-DATAISO-14: saveMetrics leaves the ownership tag set before it resolves, even under network latency', async () => {
    const store = installBrowserStorage();
    (global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/auth/me') {
        await new Promise(r => setTimeout(r, 20));
        return { ok: true, json: async () => ({ userId: 'user-a', email: 'a@test.com', name: 'a', role: 'user' }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { saveMetrics } = await import('../lib/storage');
    await saveMetrics({ totalIssues: 5, flow: { items: [] } });

    expect(store.dc_metrics_owner_v1).toBe('user-a');
  });

  test('TC-DATAISO-15: a freshly saved upload survives an immediate loadMetricsWithSource call (closes the fire-and-forget tagging race)', async () => {
    installBrowserStorage();
    (global as any).fetch = jest.fn(async (url: string) => {
      if (url === '/api/auth/me') {
        await new Promise(r => setTimeout(r, 15));
        return { ok: true, json: async () => ({ userId: 'user-a', email: 'a@test.com', name: 'a', role: 'user' }) };
      }
      // No server-side metrics — e.g. local-only storage mode, upload never touched the server.
      return { ok: true, json: async () => ({ available: false, message: 'No latest metrics file found on the server.' }) };
    });

    const { saveMetrics, loadMetricsWithSource } = await import('../lib/storage');
    await saveMetrics({ totalIssues: 42, flow: { items: [] } });

    const result = await loadMetricsWithSource();
    expect(result.metrics).toEqual({ totalIssues: 42, flow: { items: [] } });
    expect(result.source).toBe('localstorage');
  });
});

describe('localImportHistory.ts — cross-account history protection', () => {
  test('TC-DATAISO-10: listLocalImportsForCurrentUser refuses another account\'s history and clears it', async () => {
    const store = installBrowserStorage({
      dc_local_import_history_v1: JSON.stringify([{
        id: '1', fileName: 'confidential-project.xlsx', fileType: 'xlsx',
        totalIssues: 10, healthScore: 80, status: 'success', warningsCount: 0, uploadedAt: 'x',
      }]),
      dc_local_import_history_owner_v1: 'user-a',
    });
    mockFetchAsUser('user-b');

    const { listLocalImportsForCurrentUser } = await import('../lib/localImportHistory');
    const result = await listLocalImportsForCurrentUser();

    expect(result).toEqual([]);
    expect(store.dc_local_import_history_v1).toBeUndefined();
  });

  test('TC-DATAISO-11: listLocalImportsForCurrentUser still serves the same account\'s own history', async () => {
    const record = {
      id: '1', fileName: 'my-export.xlsx', fileType: 'xlsx',
      totalIssues: 10, healthScore: 80, status: 'success' as const, warningsCount: 0, uploadedAt: 'x',
    };
    installBrowserStorage({
      dc_local_import_history_v1: JSON.stringify([record]),
      dc_local_import_history_owner_v1: 'user-a',
    });
    mockFetchAsUser('user-a');

    const { listLocalImportsForCurrentUser } = await import('../lib/localImportHistory');
    expect(await listLocalImportsForCurrentUser()).toEqual([record]);
  });
});

describe('GET /api/imports — no longer falls back to the unscoped file store', () => {
  const mockFindMany = jest.fn();
  let mockSession: { isLoggedIn: boolean; userId?: string; role?: string } = { isLoggedIn: false };

  jest.mock('next/headers', () => ({ cookies: jest.fn() }));
  jest.mock('iron-session', () => ({ getIronSession: jest.fn(async () => mockSession) }));
  jest.mock('@/lib/prisma', () => ({ prisma: { importLog: { findMany: (...a: unknown[]) => mockFindMany(...a) } } }));
  jest.mock('@/lib/workspace', () => ({ getWorkspaceForUser: jest.fn(async () => null) }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { isLoggedIn: false };
  });

  test('TC-DATAISO-12: returns 401 for an unauthenticated request, not the unscoped file fallback', async () => {
    const { GET } = await import('../../app/api/imports/route');
    const res = await GET({ nextUrl: { searchParams: new URLSearchParams() } } as any);
    expect(res.status).toBe(401);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  test('TC-DATAISO-13: scopes the DB query to the caller\'s own userId for a regular user', async () => {
    mockSession = { isLoggedIn: true, userId: 'user-a', role: 'user' };
    mockFindMany.mockResolvedValue([]);
    const { GET } = await import('../../app/api/imports/route');
    await GET({ nextUrl: { searchParams: new URLSearchParams() } } as any);
    const callArg = mockFindMany.mock.calls[0][0];
    expect(callArg.where.userId).toBe('user-a');
  });
});
