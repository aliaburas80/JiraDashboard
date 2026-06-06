// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Cloud restore hardening tests — Jira integration gate.

const DATA_DIR = `${process.cwd()}/data`;
const LATEST_METRICS_FILE = `${DATA_DIR}/latest-metrics.json`;
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

test('TC-CS-10: latest-metrics.json is included in backup bundles when present', async () => {
  const files: Record<string, Buffer> = {
    [LATEST_METRICS_FILE]: Buffer.from(JSON.stringify({ savedAt: '2026-06-06T00:00:00.000Z', metrics: { totalIssues: 3 } })),
  };

  jest.doMock('fs', () => ({
    existsSync: jest.fn((path: string) => path in files),
    readFileSync: jest.fn((path: string) => files[path]),
    writeFileSync: jest.fn(),
    copyFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn((path: string) => ({ size: files[path]?.length ?? 0 })),
  }));

  const { createBackup } = await import('../services/settings/backup.service');
  const bundle = createBackup();
  const manifestRow = bundle.manifest.files.find(file => file.name === 'latest-metrics.json');

  expect(manifestRow?.included).toBe(true);
  expect(bundle.files['latest-metrics.json']).toBeDefined();
  expect(Buffer.from(bundle.files['latest-metrics.json'], 'base64').toString('utf-8')).toContain('totalIssues');
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
