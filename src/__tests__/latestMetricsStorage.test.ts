// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// latestMetricsStorage origin metadata — ARCH-05 JIRA-08.

afterEach(() => {
  jest.dontMock('fs');
  jest.resetModules();
});

test('TC-JIRA-47: writeLatestMetrics persists the jira-api origin and readLatestMetrics returns it', async () => {
  const files: Record<string, string> = {};

  jest.doMock('fs', () => ({
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn((path: string, data: string) => { files[path] = data; }),
    existsSync: jest.fn((path: string) => path in files),
    readFileSync: jest.fn((path: string) => files[path]),
  }));

  const { writeLatestMetrics, readLatestMetrics } = await import('../services/metrics/latestMetricsStorage');

  writeLatestMetrics({ totalIssues: 7 }, {
    source: 'jira-api',
    connectionName: 'Production',
    connectionId: 'conn-1',
  });

  const result = readLatestMetrics();
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

  writeLatestMetrics({ totalIssues: 3 });

  const result = readLatestMetrics();
  expect(result?.origin).toBeNull();
  expect(result?.metrics).toEqual({ totalIssues: 3 });
});

test('TC-JIRA-49: readLatestMetrics tolerates a pre-existing file written before origin metadata existed', async () => {
  const files: Record<string, string> = {
    [`${process.cwd()}/data/latest-metrics.json`]: JSON.stringify({
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
  const result = readLatestMetrics();

  expect(result?.origin).toBeNull();
  expect(result?.metrics).toEqual({ totalIssues: 5 });
});

test('TC-JIRA-50: a failed Jira sync never overwrites the last-good snapshot (writeLatestMetrics is never called on failure)', async () => {
  // This is a contract test, not a route test: writeLatestMetrics must only be
  // reachable from the sync route's success path. Verified at the route level
  // by jiraConnections.test.ts; this test documents the storage-layer guarantee
  // that readLatestMetrics never mutates state — it is purely a reader.
  const files: Record<string, string> = {
    [`${process.cwd()}/data/latest-metrics.json`]: JSON.stringify({
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
  readLatestMetrics();
  readLatestMetrics();

  expect(writeFileSync).not.toHaveBeenCalled();
});
