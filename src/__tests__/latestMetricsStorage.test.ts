// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// latestMetricsStorage — per-scope (workspace/user) files (EP-020), origin
// metadata (ARCH-05 JIRA-08).

afterEach(() => {
  jest.dontMock('fs');
  jest.resetModules();
});

test('TC-JIRA-47: writeLatestMetrics persists the jira-api origin and readLatestMetrics returns it for the same scope', async () => {
  const files: Record<string, string> = {};

  jest.doMock('fs', () => ({
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn((path: string, data: string) => { files[path] = data; }),
    existsSync: jest.fn((path: string) => path in files),
    readFileSync: jest.fn((path: string) => files[path]),
  }));

  const { writeLatestMetrics, readLatestMetrics } = await import('../services/metrics/latestMetricsStorage');

  writeLatestMetrics('ws:team-1', { totalIssues: 7 }, {
    source: 'jira-api',
    connectionName: 'Production',
    connectionId: 'conn-1',
  });

  const result = readLatestMetrics('ws:team-1');
  expect(result?.origin).toEqual({ source: 'jira-api', connectionName: 'Production', connectionId: 'conn-1' });
  expect(result?.metrics).toEqual({ totalIssues: 7 });
});

test('TC-JIRA-48: writeLatestMetrics with no origin still round-trips (backward compatible)', async () => {
  const files: Record<string, string> = {};

  jest.doMock('fs', () => ({
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn((path: string, data: string) => { files[path] = data; }),
    existsSync: jest.fn((path: string) => path in files),
    readFileSync: jest.fn((path: string) => files[path]),
  }));

  const { writeLatestMetrics, readLatestMetrics } = await import('../services/metrics/latestMetricsStorage');

  writeLatestMetrics('user:u-1', { totalIssues: 3 });

  const result = readLatestMetrics('user:u-1');
  expect(result?.origin).toBeNull();
  expect(result?.metrics).toEqual({ totalIssues: 3 });
});

test('TC-JIRA-49: readLatestMetrics tolerates a pre-existing file written before origin metadata existed', async () => {
  const files: Record<string, string> = {
    [`${process.cwd()}/data/metrics/ws_team-1.json`]: JSON.stringify({
      savedAt: '2026-06-01T00:00:00.000Z',
      metrics: { totalIssues: 5 },
    }),
  };

  jest.doMock('fs', () => ({
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn((path: string) => path in files),
    readFileSync: jest.fn((path: string) => files[path]),
  }));

  const { readLatestMetrics } = await import('../services/metrics/latestMetricsStorage');
  const result = readLatestMetrics('ws:team-1');

  expect(result?.origin).toBeNull();
  expect(result?.metrics).toEqual({ totalIssues: 5 });
});

test('TC-JIRA-50: a failed Jira sync never overwrites the last-good snapshot (writeLatestMetrics is never called on failure)', async () => {
  // This is a contract test, not a route test: writeLatestMetrics must only be
  // reachable from the sync route's success path. Verified at the route level
  // by jiraConnections.test.ts; this test documents the storage-layer guarantee
  // that readLatestMetrics never mutates state — it is purely a reader.
  const files: Record<string, string> = {
    [`${process.cwd()}/data/metrics/ws_team-1.json`]: JSON.stringify({
      savedAt: '2026-06-01T00:00:00.000Z',
      metrics: { totalIssues: 5 },
      origin: { source: 'jira-api', connectionName: 'Production' },
    }),
  };
  const writeFileSync = jest.fn();

  jest.doMock('fs', () => ({
    mkdirSync: jest.fn(),
    writeFileSync,
    existsSync: jest.fn((path: string) => path in files),
    readFileSync: jest.fn((path: string) => files[path]),
  }));

  const { readLatestMetrics } = await import('../services/metrics/latestMetricsStorage');
  readLatestMetrics('ws:team-1');
  readLatestMetrics('ws:team-1');

  expect(writeFileSync).not.toHaveBeenCalled();
});

// EP-020 — the actual bug being fixed: two different scopes must never see
// each other's data.
test('TC-JIRA-51: two different scope keys never read each other\'s metrics (cross-user/workspace isolation)', async () => {
  const files: Record<string, string> = {};

  jest.doMock('fs', () => ({
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn((path: string, data: string) => { files[path] = data; }),
    existsSync: jest.fn((path: string) => path in files),
    readFileSync: jest.fn((path: string) => files[path]),
  }));

  const { writeLatestMetrics, readLatestMetrics } = await import('../services/metrics/latestMetricsStorage');

  writeLatestMetrics('ws:team-a', { totalIssues: 100, owner: 'A' });
  writeLatestMetrics('user:solo-b', { totalIssues: 1, owner: 'B' });

  expect(readLatestMetrics('ws:team-a')?.metrics).toEqual({ totalIssues: 100, owner: 'A' });
  expect(readLatestMetrics('user:solo-b')?.metrics).toEqual({ totalIssues: 1, owner: 'B' });
  // A brand-new scope with nothing written yet must be empty, never fall
  // back to someone else's data.
  expect(readLatestMetrics('user:brand-new')).toBeNull();
});

test('TC-JIRA-52: writeLatestMetrics/readLatestMetrics reject a malformed scope key', async () => {
  jest.doMock('fs', () => ({
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    existsSync: jest.fn(() => false),
    readFileSync: jest.fn(),
  }));

  const { writeLatestMetrics, readLatestMetrics } = await import('../services/metrics/latestMetricsStorage');

  expect(() => writeLatestMetrics('../etc/passwd', { totalIssues: 1 })).toThrow();
  expect(() => readLatestMetrics('not-a-valid-scope')).toThrow();
});
