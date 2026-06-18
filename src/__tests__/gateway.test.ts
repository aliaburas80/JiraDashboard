// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Backend Integration Gateway tests — TC-GW-01 onward (added 2026-06-08 to
// close GW-23 / TODO-List.md Section 14): endpoint policy (SSRF/allowlist),
// retry/backoff policy, secret redaction + audit logging, the config-driven
// provider registry, and the callExternal() entry point end to end.

export {};

const mockFiles: Record<string, string> = {};
const fsState = { failAppend: false };

jest.mock('fs', () => ({
  existsSync:     (p: string) => p in mockFiles,
  readFileSync:   (p: string) => mockFiles[p],
  writeFileSync:  (p: string, content: string) => { mockFiles[p] = content; },
  appendFileSync: (p: string, content: string) => {
    if (fsState.failAppend) throw new Error('disk full');
    mockFiles[p] = (mockFiles[p] ?? '') + content;
  },
  mkdirSync:      () => {},
}));

beforeEach(() => {
  for (const key of Object.keys(mockFiles)) delete mockFiles[key];
  fsState.failAppend = false;
  jest.resetModules();
  delete (global as any).fetch;
});

afterEach(() => {
  delete (global as any).fetch;
});

// ── Endpoint policy / SSRF protection ─────────────────────────────────────────

describe('endpointPolicy — SSRF and allowlist protection', () => {
  test('TC-GW-01: rejects a host that is not in the provider allowlist', async () => {
    const { validateEndpoint } = await import('../server/gateway/endpointPolicy');
    const result = validateEndpoint('https://evil.example.com/api', { allowedHosts: ['api.atlassian.com'], isProduction: true });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/not in the provider's allowlist/);
  });

  test('TC-GW-02: rejects non-https protocols in production', async () => {
    const { validateEndpoint } = await import('../server/gateway/endpointPolicy');
    const result = validateEndpoint('http://api.atlassian.com/api', { allowedHosts: ['api.atlassian.com'], isProduction: true });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/Protocol/);
  });

  test('TC-GW-03: blocks private/internal IP ranges and localhost in production (SSRF)', async () => {
    const { validateEndpoint } = await import('../server/gateway/endpointPolicy');

    const internal = validateEndpoint('https://10.0.0.5/internal', { allowedHosts: ['10.0.0.5'], isProduction: true });
    expect(internal.allowed).toBe(false);
    expect(internal.reason).toMatch(/SSRF/);

    const local = validateEndpoint('https://localhost/api', { allowedHosts: ['localhost'], isProduction: true });
    expect(local.allowed).toBe(false);
    expect(local.reason).toMatch(/Localhost/);
  });

  test('TC-GW-04: rejects path traversal attempts', async () => {
    const { validateEndpoint } = await import('../server/gateway/endpointPolicy');
    const result = validateEndpoint('https://api.atlassian.com/api/../../etc/passwd', { allowedHosts: ['api.atlassian.com'], isProduction: true });
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/traversal/);
  });

  test('TC-GW-05: allows a valid allowlisted https endpoint and returns the resolved URL', async () => {
    const { validateEndpoint } = await import('../server/gateway/endpointPolicy');
    const result = validateEndpoint('https://api.atlassian.com/rest/api/3/search', { allowedHosts: ['api.atlassian.com'], isProduction: true });
    expect(result.allowed).toBe(true);
    expect(result.resolvedUrl).toBe('https://api.atlassian.com/rest/api/3/search');
  });

  test('TC-GW-05b: localhost is allowed outside production only when explicitly opted in', async () => {
    const { validateEndpoint } = await import('../server/gateway/endpointPolicy');
    const blocked = validateEndpoint('http://localhost:4000/api', { allowedHosts: ['localhost'], isProduction: false });
    expect(blocked.allowed).toBe(false);

    const allowed = validateEndpoint('http://localhost:4000/api', { allowedHosts: ['localhost'], isProduction: false, allowLocalhost: true });
    expect(allowed.allowed).toBe(true);
  });
});

// ── Retry / timeout / backoff policy ──────────────────────────────────────────

describe('retryPolicy — timeout, retry, and backoff', () => {
  test('TC-GW-06: retryable HTTP statuses (e.g. 503) are retried; non-retryable (e.g. 404) are not', async () => {
    const { isRetryable } = await import('../server/gateway/retryPolicy');
    expect(isRetryable(503, 'retryable_http')).toBe(true);
    expect(isRetryable(429, 'retryable_http')).toBe(true);
    expect(isRetryable(404, 'non_retryable_http')).toBe(false);
    expect(isRetryable(401, 'non_retryable_http')).toBe(false);
  });

  test('TC-GW-07: policy-rejected and validation failures are never retried', async () => {
    const { isRetryable } = await import('../server/gateway/retryPolicy');
    expect(isRetryable(undefined, 'policy_rejected')).toBe(false);
    expect(isRetryable(undefined, 'validation')).toBe(false);
  });

  test('TC-GW-08: network and timeout failures with no HTTP status are retried', async () => {
    const { isRetryable } = await import('../server/gateway/retryPolicy');
    expect(isRetryable(undefined, 'network')).toBe(true);
    expect(isRetryable(undefined, 'timeout')).toBe(true);
  });

  test('TC-GW-09: backoff delay grows exponentially from the configured base', async () => {
    const { computeBackoffDelay, DEFAULT_RETRY_POLICY } = await import('../server/gateway/retryPolicy');
    expect(computeBackoffDelay(0)).toBe(DEFAULT_RETRY_POLICY.baseDelayMs * 1);
    expect(computeBackoffDelay(1)).toBe(DEFAULT_RETRY_POLICY.baseDelayMs * 2);
    expect(computeBackoffDelay(2)).toBe(DEFAULT_RETRY_POLICY.baseDelayMs * 4);
  });
});

// ── Secret redaction and audit logging ────────────────────────────────────────

describe('gatewayLogger — redaction and JSONL audit logging', () => {
  test('TC-GW-10: redact() masks token/key/password/secret-shaped substrings', async () => {
    const { redact } = await import('../server/gateway/gatewayLogger');
    expect(redact('apiKey: sk-12345-abcdef')).toContain('[REDACTED]');
    expect(redact('apiKey: sk-12345-abcdef')).not.toContain('sk-12345-abcdef');
    expect(redact('Authorization: Bearer abc.def.ghi')).not.toContain('abc.def.ghi');
    expect(redact('password=hunter2')).not.toContain('hunter2');
  });

  test('TC-GW-11: redact() leaves ordinary text untouched', async () => {
    const { redact } = await import('../server/gateway/gatewayLogger');
    expect(redact('HTTP 503: Service Unavailable')).toBe('HTTP 503: Service Unavailable');
  });

  test('TC-GW-12: logGatewayCall() appends a redacted JSONL record and never throws on write failure', async () => {
    const { logGatewayCall } = await import('../server/gateway/gatewayLogger');

    logGatewayCall({
      requestId: 'req-1',
      provider: 'jira',
      operation: 'jira.fetchIssues',
      endpointAlias: 'jira:jira.fetchIssues',
      method: 'GET',
      startedAt: '2026-06-08T00:00:00.000Z',
      endedAt: '2026-06-08T00:00:01.000Z',
      durationMs: 1000,
      retryCount: 0,
      status: 401,
      errorCategory: 'non_retryable_http',
      error: 'HTTP 401: token=secret-value-123 rejected',
    });

    const written = Object.values(mockFiles).find((content) => content.includes('"requestId":"req-1"'));
    expect(written).toBeDefined();
    expect(written).not.toContain('secret-value-123');
    expect(written).toContain('[REDACTED]');

    // A logging failure must never throw — even when the filesystem is broken.
    fsState.failAppend = true;
    expect(() => logGatewayCall({
      requestId: 'req-2',
      provider: 'slack',
      operation: 'slack.postMessage',
      endpointAlias: 'slack:slack.postMessage',
      method: 'POST',
      startedAt: '2026-06-08T00:00:00.000Z',
      endedAt: '2026-06-08T00:00:01.000Z',
      durationMs: 1000,
      retryCount: 0,
    })).not.toThrow();
  });
});

// ── Provider registry — config-file-driven, zero-code-change ─────────────────

describe('providerRegistry — env-driven and config-file-overridable', () => {
  const ENV_KEYS = [
    'GATEWAY_JIRA_BASE_URL', 'GATEWAY_JIRA_API_TOKEN',
    'GATEWAY_SLACK_BASE_URL', 'GATEWAY_SLACK_BOT_TOKEN',
    'GATEWAY_CUSTOM_BASE_URL', 'GATEWAY_CUSTOM_API_KEY',
    'GATEWAY_REMAPPED_URL', 'GATEWAY_REMAPPED_TOKEN',
  ];

  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  test('TC-GW-13: a provider with no configured env vars reports enabled: false and an empty allowlist', async () => {
    const { getProviderConfig } = await import('../server/gateway/providerRegistry');
    const config = getProviderConfig('jira');
    expect(config.enabled).toBe(false);
    expect(config.allowedHosts).toEqual([]);
    expect(config.baseUrl).toBeUndefined();
  });

  test('TC-GW-14: a provider becomes enabled once its base URL and credential env vars are set', async () => {
    process.env.GATEWAY_JIRA_BASE_URL = 'https://api.atlassian.com';
    process.env.GATEWAY_JIRA_API_TOKEN = 'token-value';
    const { getProviderConfig } = await import('../server/gateway/providerRegistry');
    const config = getProviderConfig('jira');
    expect(config.enabled).toBe(true);
    expect(config.baseUrl).toBe('https://api.atlassian.com');
    expect(config.allowedHosts).toEqual(['api.atlassian.com']);
  });

  test('TC-GW-15: data/gateway-providers.json can remap env-var names and extend the allowlist with zero code changes', async () => {
    process.env.GATEWAY_REMAPPED_URL = 'https://hooks.slack.com';
    process.env.GATEWAY_REMAPPED_TOKEN = 'xoxb-remapped';

    const { writeProviderConfigFile, getProviderConfig } = await import('../server/gateway/providerRegistry');
    writeProviderConfigFile({
      providers: {
        slack: {
          baseUrlEnvVar: 'GATEWAY_REMAPPED_URL',
          credentialEnvVars: ['GATEWAY_REMAPPED_TOKEN'],
          allowedHosts: ['slack.com'],
        },
      },
    });

    const config = getProviderConfig('slack');
    expect(config.enabled).toBe(true);
    expect(config.baseUrlEnvVar).toBe('GATEWAY_REMAPPED_URL');
    expect(config.allowedHosts).toEqual(expect.arrayContaining(['hooks.slack.com', 'slack.com']));
  });

  test('TC-GW-15b: an explicit "enabled": false in the config file kill-switches a provider even with valid env vars', async () => {
    process.env.GATEWAY_CUSTOM_BASE_URL = 'https://example-integration.test';
    process.env.GATEWAY_CUSTOM_API_KEY = 'key-value';

    const { writeProviderConfigFile, getProviderConfig } = await import('../server/gateway/providerRegistry');
    writeProviderConfigFile({ providers: { custom: { enabled: false, baseUrlEnvVar: 'GATEWAY_CUSTOM_BASE_URL', credentialEnvVars: ['GATEWAY_CUSTOM_API_KEY'] } } });

    const config = getProviderConfig('custom');
    expect(config.enabled).toBe(false);
  });
});

// ── callExternal() — the single entry point, end to end ───────────────────────

describe('callExternal — single entry point (mocked fetch)', () => {
  const ENV_KEYS = ['GATEWAY_JIRA_BASE_URL', 'GATEWAY_JIRA_API_TOKEN'];

  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  function enableJira() {
    process.env.GATEWAY_JIRA_BASE_URL = 'https://api.atlassian.com';
    process.env.GATEWAY_JIRA_API_TOKEN = 'token-value';
  }

  test('TC-GW-16: a disabled (unconfigured) provider is rejected before any fetch is attempted', async () => {
    const fetchSpy = jest.fn();
    (global as any).fetch = fetchSpy;

    const { callExternal } = await import('../server/gateway/externalGateway');
    const result = await callExternal({ provider: 'jira', operation: 'jira.fetchIssues', method: 'GET', path: 'rest/api/3/search' });

    expect(result.ok).toBe(false);
    expect(result.errorCategory).toBe('policy_rejected');
    expect(result.error).toMatch(/not configured/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.requestId).toEqual(expect.any(String));
  });

  test('TC-GW-17: an absolute-URL "path" cannot redirect the call to a host outside the allowlist (SSRF via path injection, policy-rejected before any fetch)', async () => {
    enableJira();
    const fetchSpy = jest.fn();
    (global as any).fetch = fetchSpy;

    const { callExternal } = await import('../server/gateway/externalGateway');
    // A naive `new URL(path, base)` would let an absolute URL in `path` override
    // the host entirely — the policy layer must catch this before any fetch.
    const result = await callExternal({ provider: 'jira', operation: 'jira.fetchIssues', method: 'GET', path: 'https://evil.example.com/steal' });

    expect(result.ok).toBe(false);
    expect(result.errorCategory).toBe('policy_rejected');
    expect(result.error).toMatch(/allowlist/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('TC-GW-18: a successful call returns ok:true with data, timing, and a generated requestId', async () => {
    enableJira();
    const fetchSpy = jest.fn<Promise<{ ok: boolean; status: number; json: () => Promise<{ issues: string[] }> }>, [string]>(
      async () => ({ ok: true, status: 200, json: async () => ({ issues: ['PROJ-1'] }) })
    );
    (global as any).fetch = fetchSpy;

    const { callExternal } = await import('../server/gateway/externalGateway');
    const result = await callExternal<{ issues: string[] }>({
      provider: 'jira', operation: 'jira.fetchIssues', method: 'GET', path: 'rest/api/3/search', userId: 'user-1',
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data?.issues).toEqual(['PROJ-1']);
    expect(result.retryCount).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.requestId).toEqual(expect.any(String));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.atlassian.com/rest/api/3/search');
  });

  test('TC-GW-19: retries a retryable status (503) and succeeds on a later attempt', async () => {
    enableJira();
    let calls = 0;
    const fetchSpy = jest.fn(async () => {
      calls += 1;
      if (calls < 2) return { ok: false, status: 503, text: async () => 'Service Unavailable' };
      return { ok: true, status: 200, json: async () => ({ issues: [] }) };
    });
    (global as any).fetch = fetchSpy;

    const { callExternal } = await import('../server/gateway/externalGateway');
    const result = await callExternal({ provider: 'jira', operation: 'jira.fetchIssues', method: 'GET', path: 'rest/api/3/search' });

    expect(result.ok).toBe(true);
    expect(result.retryCount).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('TC-GW-20: exhausts retries on a persistent retryable failure and returns a clean error result', async () => {
    enableJira();
    const fetchSpy = jest.fn(async () => ({ ok: false, status: 503, text: async () => 'Service Unavailable' }));
    (global as any).fetch = fetchSpy;

    const { callExternal, } = await import('../server/gateway/externalGateway');
    const { DEFAULT_RETRY_POLICY } = await import('../server/gateway/retryPolicy');
    const result = await callExternal({ provider: 'jira', operation: 'jira.fetchIssues', method: 'GET', path: 'rest/api/3/search' });

    expect(result.ok).toBe(false);
    expect(result.errorCategory).toBe('retryable_http');
    expect(result.status).toBe(503);
    expect(result.retryCount).toBe(DEFAULT_RETRY_POLICY.maxRetries);
    expect(fetchSpy).toHaveBeenCalledTimes(DEFAULT_RETRY_POLICY.maxRetries + 1);
  });

  test('TC-GW-21: a non-retryable status (404) fails immediately without retrying', async () => {
    enableJira();
    const fetchSpy = jest.fn(async () => ({ ok: false, status: 404, text: async () => 'Not Found' }));
    (global as any).fetch = fetchSpy;

    const { callExternal } = await import('../server/gateway/externalGateway');
    const result = await callExternal({ provider: 'jira', operation: 'jira.fetchIssues', method: 'GET', path: 'rest/api/3/search' });

    expect(result.ok).toBe(false);
    expect(result.errorCategory).toBe('non_retryable_http');
    expect(result.retryCount).toBe(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
