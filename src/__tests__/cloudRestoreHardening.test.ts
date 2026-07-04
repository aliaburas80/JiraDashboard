// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Cloud restore hardening tests — Jira integration gate.

const DATA_DIR = `${process.cwd()}/data`;
const CACHE_FILE = `${DATA_DIR}/.cloud-cache-meta.json`;
const STORAGE_SETTINGS_FILE = `${DATA_DIR}/storage-settings.json`;

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

// /api/metrics/latest now requires authentication (P0A-04). Stub iron-session
// with a logged-in session so these cloud-restore tests keep testing what they
// were designed to test (cloud-sync and source detection), not auth.
jest.mock('next/headers', () => ({ cookies: jest.fn(() => ({})) }));
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(async () => ({
    isLoggedIn: true,
    userId: 'test-user',
    email: 'test@test.com',
    role: 'admin',
  })),
}));
// EP-020: /api/metrics/latest resolves a per-user/workspace scope key before
// reading metrics — stub it out so these tests keep exercising cloud-sync and
// source detection rather than real workspace/DB lookups.
jest.mock('@/lib/workspace', () => ({
  getMetricsScopeKeyForUser: jest.fn(async () => 'user:test-user'),
}));

afterEach(() => {
  jest.dontMock('fs');
  jest.dontMock('@/services/storage/cloudSync');
  jest.dontMock('@/services/metrics/latestMetricsStorage');
  jest.resetModules();
  jest.restoreAllMocks();
  delete (global as any).window;
  delete (global as any).localStorage;
  delete (global as any).CustomEvent;
  delete (global as any).fetch;
});

test('TC-CS-09: /api/metrics/latest returns HTTP 200 with available:false when latest metrics are absent', async () => {
  jest.doMock('@/services/storage/cloudSync', () => ({
    syncFromCloud: jest.fn(async () => ({
      status: 'offline',
      source: 'local',
      reason: 'Local storage mode — no cloud sync.',
    })),
  }));
  jest.doMock('@/services/metrics/latestMetricsStorage', () => ({
    readLatestMetrics: jest.fn(() => null),
  }));

  const { GET } = await import('../../app/api/metrics/latest/route');
  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.available).toBe(false);
  expect(body.source).toBe('none');
  expect(body.message).toContain('Local storage mode');
});

test('TC-CS-10: workspace/user-scoped metrics files (EP-020) are individually included in backup bundles', async () => {
  const METRICS_DIR = `${DATA_DIR}/metrics`;
  const scopedFile = `${METRICS_DIR}/ws_team-1.json`;
  const files: Record<string, Buffer> = {
    [scopedFile]: Buffer.from(JSON.stringify({ savedAt: '2026-06-06T00:00:00.000Z', metrics: { totalIssues: 3 } })),
  };

  jest.doMock('fs', () => ({
    existsSync: jest.fn((path: string) => path in files || path === METRICS_DIR),
    readFileSync: jest.fn((path: string) => files[path]),
    writeFileSync: jest.fn(),
    copyFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn((path: string) => ({ size: files[path]?.length ?? 0 })),
    readdirSync: jest.fn(() => ['ws_team-1.json']),
  }));

  const { createBackup } = await import('../services/settings/backup.service');
  const bundle = createBackup();
  const manifestRow = bundle.manifest.files.find(file => file.name === 'metrics/ws_team-1.json');

  expect(manifestRow?.included).toBe(true);
  expect(bundle.files['metrics/ws_team-1.json']).toBeDefined();
  expect(Buffer.from(bundle.files['metrics/ws_team-1.json'], 'base64').toString('utf-8')).toContain('totalIssues');
});

test('TC-CS-10b: two different workspace metrics files never collide or overwrite each other in a backup bundle', async () => {
  const METRICS_DIR = `${DATA_DIR}/metrics`;
  const files: Record<string, Buffer> = {
    [`${METRICS_DIR}/ws_team-a.json`]: Buffer.from(JSON.stringify({ savedAt: '2026-06-06T00:00:00.000Z', metrics: { totalIssues: 3, owner: 'A' } })),
    [`${METRICS_DIR}/user_solo-b.json`]: Buffer.from(JSON.stringify({ savedAt: '2026-06-06T00:00:00.000Z', metrics: { totalIssues: 9, owner: 'B' } })),
  };

  jest.doMock('fs', () => ({
    existsSync: jest.fn((path: string) => path in files || path === METRICS_DIR),
    readFileSync: jest.fn((path: string) => files[path]),
    writeFileSync: jest.fn(),
    copyFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn((path: string) => ({ size: files[path]?.length ?? 0 })),
    readdirSync: jest.fn(() => ['ws_team-a.json', 'user_solo-b.json']),
  }));

  const { createBackup } = await import('../services/settings/backup.service');
  const bundle = createBackup();

  expect(Buffer.from(bundle.files['metrics/ws_team-a.json'], 'base64').toString('utf-8')).toContain('"owner":"A"');
  expect(Buffer.from(bundle.files['metrics/user_solo-b.json'], 'base64').toString('utf-8')).toContain('"owner":"B"');
});

test('TC-CS-11: syncFromCloud does not overwrite pending local changes with bucket data', async () => {
  const files: Record<string, string> = {
    [STORAGE_SETTINGS_FILE]: JSON.stringify({
      active: 's3',
      s3: { bucket: 'delivery-clarity' },
    }),
    [CACHE_FILE]: JSON.stringify({
      provider: 's3',
      key: 'latest.json',
      contentHash: 'abc123',
      fetchedAt: '2026-06-06T00:00:00.000Z',
      pendingPush: true,
    }),
  };

  jest.doMock('fs', () => ({
    existsSync: jest.fn((path: string) => path in files),
    readFileSync: jest.fn((path: string) => files[path]),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
  }));

  const { syncFromCloud } = await import('../services/storage/cloudSync');
  const result = await syncFromCloud();

  expect(result.status).toBe('fallback');
  expect(result.source).toBe('local');
  expect(result.reason).toContain('waiting to be pushed');
});

test('TC-CS-12: loadMetricsWithSource falls back to localStorage when bucket/server metrics are unavailable', async () => {
  const localMetrics = { totalIssues: 42, flow: { items: [] } };
  const store = installBrowserStorage({
    dc_metrics_v2: JSON.stringify(localMetrics),
  });
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      available: false,
      message: 'No latest metrics file found on the server.',
    }),
  }));

  const { loadMetricsWithSource, getMetricsSource } = await import('../lib/storage');
  const result = await loadMetricsWithSource();

  expect(result.metrics).toEqual(localMetrics);
  expect(result.source).toBe('localstorage');
  expect(result.fallbackUsed).toBe(true);
  expect(result.error).toContain('No latest metrics');
  expect(JSON.parse(store.dc_metrics_source_v1).source).toBe('localstorage');
  expect(getMetricsSource()?.source).toBe('localstorage');
});

test('TC-CS-13: /api/metrics/latest reports jira-api source + connection name when the snapshot originated from a Jira sync (JIRA-08)', async () => {
  jest.doMock('@/services/storage/cloudSync', () => ({
    syncFromCloud: jest.fn(async () => ({ status: 'offline', source: 'local', reason: 'Local storage mode.' })),
  }));
  jest.doMock('@/services/metrics/latestMetricsStorage', () => ({
    readLatestMetrics: jest.fn(() => ({
      savedAt: '2026-06-21T12:00:00.000Z',
      metrics: { totalIssues: 7 },
      origin: { source: 'jira-api', connectionName: 'Production', connectionId: 'conn-1' },
    })),
  }));

  const { GET } = await import('../../app/api/metrics/latest/route');
  const response = await GET();
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.available).toBe(true);
  expect(body.source).toBe('jira-api');
  expect(body.connectionName).toBe('Production');
});

test('TC-CS-14: /api/metrics/latest falls back to bucket/cache detection when the snapshot has no Jira origin', async () => {
  jest.doMock('@/services/storage/cloudSync', () => ({
    syncFromCloud: jest.fn(async () => ({ status: 'restored', source: 'bucket', provider: 's3', key: 'latest.json' })),
  }));
  jest.doMock('@/services/metrics/latestMetricsStorage', () => ({
    readLatestMetrics: jest.fn(() => ({
      savedAt: '2026-06-21T12:00:00.000Z',
      metrics: { totalIssues: 3 },
      origin: { source: 'file' },
    })),
  }));

  const { GET } = await import('../../app/api/metrics/latest/route');
  const response = await GET();
  const body = await response.json();

  expect(body.source).toBe('bucket');
  expect(body.connectionName).toBeUndefined();
});

test('TC-CS-15: loadMetricsWithSource threads connectionName through for jira-api snapshots', async () => {
  installBrowserStorage();
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      available: true,
      metrics: { totalIssues: 7 },
      savedAt: '2026-06-21T12:00:00.000Z',
      source: 'jira-api',
      connectionName: 'Production',
    }),
  }));

  const { loadMetricsWithSource } = await import('../lib/storage');
  const result = await loadMetricsWithSource();

  expect(result.source).toBe('jira-api');
  expect(result.connectionName).toBe('Production');
  expect(result.fallbackUsed).toBe(false);
});
