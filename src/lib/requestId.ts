// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0A-07: per-request correlation ID. proxy.ts generates/reuses one for every
// /api/* request and forwards it via the x-request-id header; route handlers
// read it back with getRequestId() and thread it into safeAuditEvent()/
// logSystemError() so a support or security question ("what happened around
// request X") can be answered without correlating timestamps by hand.
//
// Uses the global Web Crypto `crypto.randomUUID()` (no `node:crypto` import)
// so this file works unmodified on both the Edge runtime (proxy.ts) and the
// Node.js runtime (route handlers).

export const REQUEST_ID_HEADER = 'x-request-id';

/** Reuses an inbound x-request-id (e.g. set by an upstream proxy/load balancer) or mints a new one. */
export function resolveRequestId(headers: Headers): string {
  return headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
}

/**
 * Reads the correlation ID proxy.ts already attached to this request. Falls
 * back to minting a fresh one whenever a usable Headers instance isn't there
 * to read from — either because proxy.ts didn't run (e.g. a unit test
 * invoking the exported GET/POST function directly with a bare mock object
 * instead of a real NextRequest), or the rare case of a handler invoked
 * outside the normal request pipeline — so callers never have to null-check.
 */
export function getRequestId(req: { headers?: Headers } | undefined | null): string {
  if (!req?.headers || typeof req.headers.get !== 'function') return crypto.randomUUID();
  return resolveRequestId(req.headers);
}
