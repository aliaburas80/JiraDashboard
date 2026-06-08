// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Backend Integration Gateway — endpoint policy / SSRF protection (GW-05, GW-08–GW-13).
//
// validateEndpoint() is the single gate every outbound gateway call passes
// through before any network request is made. It never throws — rejections
// come back as a structured { allowed: false, reason } so the caller can log
// and return a clean GatewayResult without a network attempt ever happening.

import type { EndpointPolicyResult } from './types';

const ALLOWED_PROTOCOLS_PROD = ['https:'];
const ALLOWED_PROTOCOLS_DEV  = ['https:', 'http:'];

// RFC 1918 / RFC 4193 / link-local / loopback ranges — blocked in production (SSRF).
const PRIVATE_IP_PATTERNS: RegExp[] = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^f[cd][0-9a-f]{2}:/i,   // fc00::/7 — unique local addresses
  /^fe80:/i,               // link-local
];

const LOCAL_HOSTNAMES = new Set(['localhost', '0.0.0.0', '::1']);

// Path must be a clean relative segment chain — restricted character set.
const SAFE_PATH_PATTERN = /^[A-Za-z0-9/_\-.]*$/;

// Detected on the RAW (pre-normalization) URL string — the URL constructor
// silently collapses "/../" segments, which would let a traversal attempt
// slip through undetected and resolve to an unexpected path on the host.
const TRAVERSAL_PATTERN = /(^|\/)\.\.(\/|$)/;

export interface EndpointPolicyOptions {
  allowedHosts: string[];
  isProduction: boolean;
  /** Only meaningful outside production — lets local dev call http://localhost. */
  allowLocalhost?: boolean;
}

function isPrivateOrInternalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (LOCAL_HOSTNAMES.has(lower)) return true;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(lower));
}

function isPathSafe(path: string): boolean {
  return SAFE_PATH_PATTERN.test(path);
}

/**
 * Validates a fully-resolved URL (provider base URL + caller-supplied path)
 * against protocol allowlist, host allowlist, SSRF protections, and path safety.
 * Returns a structured result — never throws, never performs a network call.
 */
export function validateEndpoint(rawUrl: string, options: EndpointPolicyOptions): EndpointPolicyResult {
  const { allowedHosts, isProduction, allowLocalhost = false } = options;

  if (TRAVERSAL_PATTERN.test(rawUrl)) {
    return { allowed: false, reason: 'Endpoint path failed safety validation (no traversal allowed).' };
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { allowed: false, reason: 'Endpoint is not a valid absolute URL.' };
  }

  const allowedProtocols = isProduction ? ALLOWED_PROTOCOLS_PROD : ALLOWED_PROTOCOLS_DEV;
  if (!allowedProtocols.includes(url.protocol)) {
    return { allowed: false, reason: `Protocol "${url.protocol}" is not allowed (https required in production).` };
  }

  const hostname = url.hostname;
  const hostAllowed = allowedHosts.some((allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`));
  if (!hostAllowed) {
    return { allowed: false, reason: `Host "${hostname}" is not in the provider's allowlist.` };
  }

  const isLocal = LOCAL_HOSTNAMES.has(hostname.toLowerCase());
  if (isLocal) {
    if (isProduction || !allowLocalhost) {
      return { allowed: false, reason: 'Localhost endpoints are blocked (SSRF protection).' };
    }
  } else if (isProduction && isPrivateOrInternalHost(hostname)) {
    return { allowed: false, reason: 'Private/internal IP ranges are blocked in production (SSRF protection).' };
  }

  if (!isPathSafe(url.pathname)) {
    return { allowed: false, reason: 'Endpoint path failed safety validation (no traversal allowed).' };
  }

  return { allowed: true, resolvedUrl: url.toString() };
}
