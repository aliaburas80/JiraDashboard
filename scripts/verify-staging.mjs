#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import process from 'node:process';

const DEFAULT_TIMEOUT_MS = 10_000;
const PRODUCTION_USER_ORIGINS = new Set([
  'https://deliveryclarity.app',
  'https://www.deliveryclarity.app',
]);

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      args.set(key, 'true');
      continue;
    }
    args.set(key, value);
    index += 1;
  }
  return args;
}

function normalizeBaseUrl(rawValue, label) {
  if (!rawValue) throw new Error(`${label} is required.`);
  const url = new URL(rawValue);
  url.pathname = '/';
  url.search = '';
  url.hash = '';

  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (!isLocal && url.protocol !== 'https:') {
    throw new Error(`${label} must use HTTPS for a remote staging deployment.`);
  }

  return url.origin;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: options.redirect ?? 'follow',
      headers: { 'user-agent': 'delivery-clarity-staging-verifier/1.0' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response, label) {
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} did not return JSON.`);
  }
}

function assertStatus(response, expected, label) {
  if (response.status !== expected) {
    throw new Error(`${label} returned HTTP ${response.status}; expected ${expected}.`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} was ${JSON.stringify(actual)}; expected ${JSON.stringify(expected)}.`);
  }
}

async function runCheck(checks, name, fn) {
  const startedAt = Date.now();
  try {
    const detail = await fn();
    const result = { name, ok: true, elapsedMs: Date.now() - startedAt, ...detail };
    checks.push(result);
    console.log(`PASS ${name} (${result.elapsedMs} ms)`);
  } catch (error) {
    const result = {
      name,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
    checks.push(result);
    console.error(`FAIL ${name}: ${result.error}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const userUrl = normalizeBaseUrl(args.get('user-url') ?? process.env.STAGING_APP_URL, 'User staging URL');
  const adminUrl = normalizeBaseUrl(args.get('admin-url') ?? process.env.STAGING_ADMIN_URL, 'Admin staging URL');
  const expectedVersion = args.get('expected-version') ?? process.env.STAGING_EXPECTED_VERSION ?? '';
  const reportPath = args.get('report') ?? process.env.STAGING_VERIFY_REPORT ?? '';

  if (userUrl === adminUrl) {
    throw new Error('User and Admin staging runtimes must use different origins.');
  }
  if (PRODUCTION_USER_ORIGINS.has(userUrl)) {
    throw new Error(`Refusing to treat production origin ${userUrl} as staging.`);
  }

  const checks = [];

  await runCheck(checks, 'user health', async () => {
    const response = await fetchWithTimeout(`${userUrl}/api/health`);
    assertStatus(response, 200, 'User health');
    const body = await readJson(response, 'User health');
    assertEqual(body.status, 'ok', 'User health status');
    assertEqual(body.service, 'delivery-clarity', 'User health service');
    if (expectedVersion) assertEqual(body.version, expectedVersion, 'User health version');
    return { status: response.status, service: body.service, version: body.version };
  });

  await runCheck(checks, 'user readiness', async () => {
    const response = await fetchWithTimeout(`${userUrl}/api/ready`);
    assertStatus(response, 200, 'User readiness');
    const body = await readJson(response, 'User readiness');
    assertEqual(body.status, 'ready', 'User readiness status');
    assertEqual(body.checks?.database, 'ok', 'User readiness database');
    return { status: response.status, database: body.checks?.database };
  });

  await runCheck(checks, 'user login surface', async () => {
    const response = await fetchWithTimeout(`${userUrl}/login`);
    assertStatus(response, 200, 'User login');
    return { status: response.status };
  });

  await runCheck(checks, 'legacy Admin API retired', async () => {
    const response = await fetchWithTimeout(`${userUrl}/api/admin/users`);
    assertStatus(response, 410, 'Legacy Admin API');
    return { status: response.status };
  });

  await runCheck(checks, 'embedded Admin route hands off', async () => {
    const response = await fetchWithTimeout(`${userUrl}/admin/settings`, { redirect: 'manual' });
    if (response.status < 300 || response.status >= 400) {
      throw new Error(`Embedded Admin route returned HTTP ${response.status}; expected a redirect.`);
    }
    const location = response.headers.get('location');
    if (!location) throw new Error('Embedded Admin redirect did not include a Location header.');
    const destination = new URL(location, userUrl);
    if (destination.origin !== adminUrl) {
      throw new Error(`Embedded Admin route redirected to ${destination.origin}; expected ${adminUrl}.`);
    }
    return { status: response.status, destinationOrigin: destination.origin };
  });

  await runCheck(checks, 'Admin health', async () => {
    const response = await fetchWithTimeout(`${adminUrl}/api/health`);
    assertStatus(response, 200, 'Admin health');
    const body = await readJson(response, 'Admin health');
    assertEqual(body.status, 'ok', 'Admin health status');
    assertEqual(body.service, 'delivery-clarity-admin', 'Admin health service');
    if (expectedVersion) assertEqual(body.version, expectedVersion, 'Admin health version');
    return { status: response.status, service: body.service, version: body.version };
  });

  await runCheck(checks, 'Admin login surface', async () => {
    const response = await fetchWithTimeout(`${adminUrl}/login`);
    assertStatus(response, 200, 'Admin login');
    return { status: response.status };
  });

  await runCheck(checks, 'Admin unauthenticated boundary', async () => {
    const response = await fetchWithTimeout(`${adminUrl}/api/auth/me`);
    assertStatus(response, 401, 'Admin unauthenticated boundary');
    return { status: response.status };
  });

  const report = {
    packet: 'EP-028',
    environment: 'staging',
    generatedAt: new Date().toISOString(),
    targets: { userUrl, adminUrl },
    expectedVersion: expectedVersion || null,
    passed: checks.filter(check => check.ok).length,
    failed: checks.filter(check => !check.ok).length,
    checks,
  };

  if (reportPath) {
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }

  console.log(`[EP-028] ${JSON.stringify(report)}`);
  if (report.failed > 0) process.exitCode = 1;
}

main().catch(error => {
  console.error(`EP-028 staging verification could not start: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
