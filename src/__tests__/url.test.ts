// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// TC-URL-01 to TC-URL-06 — resolveRequestOrigin()

import { resolveRequestOrigin, normalizeAppUrl } from '../lib/url';

function makeReq(headers: Record<string, string>, url: string) {
  return { headers: new Headers(headers), nextUrl: new URL(url) };
}

test('TC-URL-01: local dev request with no forwarded headers resolves to localhost', () => {
  const req = makeReq({ host: 'localhost:3000' }, 'http://localhost:3000/api/auth/register');
  expect(resolveRequestOrigin(req)).toBe('http://localhost:3000');
});

test('TC-URL-02: request behind a proxy honours X-Forwarded-Proto/Host over the raw nextUrl', () => {
  const req = makeReq(
    { host: 'internal-host:10000', 'x-forwarded-proto': 'https', 'x-forwarded-host': 'delivery-clarity.onrender.com' },
    'http://internal-host:10000/api/auth/register',
  );
  expect(resolveRequestOrigin(req)).toBe('https://delivery-clarity.onrender.com');
});

test('TC-URL-03: falls back to the Host header when no X-Forwarded-Host is present', () => {
  const req = makeReq(
    { host: 'deliveryclarity.app', 'x-forwarded-proto': 'https' },
    'http://internal:10000/api/auth/register',
  );
  expect(resolveRequestOrigin(req)).toBe('https://deliveryclarity.app');
});

test('TC-URL-04: falls back to nextUrl protocol when no X-Forwarded-Proto is present', () => {
  const req = makeReq({ host: 'example.com' }, 'https://example.com/api/auth/register');
  expect(resolveRequestOrigin(req)).toBe('https://example.com');
});

test('TC-URL-05: a comma-separated X-Forwarded-Host takes only the first value', () => {
  const req = makeReq(
    { host: 'internal', 'x-forwarded-proto': 'https', 'x-forwarded-host': 'deliveryclarity.app, internal-lb' },
    'http://internal/api/auth/register',
  );
  expect(resolveRequestOrigin(req)).toBe('https://deliveryclarity.app');
});

// ── Pre-existing normalizeAppUrl (unchanged, spot-checked for regression) ──────

test('TC-URL-06: normalizeAppUrl adds https:// to a bare host and strips trailing slashes', () => {
  expect(normalizeAppUrl('deliveryclarity.app/')).toBe('https://deliveryclarity.app');
  expect(normalizeAppUrl(undefined)).toBe('http://localhost:3000');
});
