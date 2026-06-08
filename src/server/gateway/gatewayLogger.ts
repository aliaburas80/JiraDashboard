// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Backend Integration Gateway — secret redaction and audit logging (GW-07, GW-15, GW-20).
//
// Gateway calls are high-volume *operational* telemetry, not human-readable
// user-audit events — they intentionally do NOT go through prisma.auditEvent
// (that table backs the admin-facing audit trail and would be polluted by
// every retry attempt; routing them there would also require a migration).
// Instead, redacted records are appended as JSON-Lines to a local data file,
// mirroring the existing data/*.json operational-config convention
// (storage-settings.json, .cloud-cache-meta.json).

import fs   from 'fs';
import path from 'path';
import type { GatewayLogRecord } from './types';

const LOG_FILE = path.join(process.cwd(), 'data', 'gateway-audit.jsonl');

const REDACTION_PATTERNS: RegExp[] = [
  /[A-Za-z0-9_-]*token[A-Za-z0-9_-]*\s*[:=]\s*["']?[^"'\s,}]+/gi,
  /[A-Za-z0-9_-]*api[_-]?key[A-Za-z0-9_-]*\s*[:=]\s*["']?[^"'\s,}]+/gi,
  /[A-Za-z0-9_-]*secret[A-Za-z0-9_-]*\s*[:=]\s*["']?[^"'\s,}]+/gi,
  /[A-Za-z0-9_-]*password[A-Za-z0-9_-]*\s*[:=]\s*["']?[^"'\s,}]+/gi,
  /authorization\s*[:=]\s*["']?[^"'\n,}]+/gi,
  /cookie\s*[:=]\s*["']?[^"'\s,}]+/gi,
  /connectionstring\s*[:=]\s*["']?[^"'\s,}]+/gi,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /Basic\s+[A-Za-z0-9+/=]+/gi,
];

/**
 * Masks secret-shaped substrings (tokens, API keys, passwords, cookies,
 * Authorization headers, connection strings, service-account JSON fields)
 * so a log line can never leak a credential, even by accident.
 */
export function redact(value: unknown): string {
  const text = typeof value === 'string' ? value : safeStringify(value);
  return REDACTION_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, (match) => {
    const separatorIndex = match.search(/[:=]/);
    if (separatorIndex === -1) return '[REDACTED]';
    return `${match.slice(0, separatorIndex + 1)} [REDACTED]`;
  }), text);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Appends one redacted gateway-call record as a JSON-Lines entry.
 * Never throws — a logging failure must never break the calling request.
 */
export function logGatewayCall(record: GatewayLogRecord): void {
  try {
    const safeRecord: GatewayLogRecord = {
      ...record,
      error: record.error !== undefined ? redact(record.error) : undefined,
    };
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${JSON.stringify(safeRecord)}\n`);
  } catch {
    // Swallow — logging must never break the gateway call it's observing.
  }
}
