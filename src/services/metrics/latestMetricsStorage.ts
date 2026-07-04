// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Server-side copy of the latest dashboard metrics, one file per
// user/workspace scope key (EP-020). Each file is included in cloud backups
// so a fresh session can load dashboard data from the bucket before falling
// back to browser localStorage.
//
// EP-020: this used to be a single flat `data/latest-metrics.json` file
// shared by the whole server process — whoever uploaded or synced most
// recently determined what every cloud-storage-mode user saw. Every caller
// now passes a scope key (see getMetricsScopeKeyForUser in src/lib/workspace.ts)
// so each workspace/user gets its own file.

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const METRICS_DIR = path.join(DATA_DIR, 'metrics');

// Scope keys are always server-derived (workspace id or user id), never raw
// user input — this pattern is defense in depth against path traversal.
const SCOPE_KEY_PATTERN = /^(ws|user):[a-zA-Z0-9_-]+$/;

function metricsFilePath(scopeKey: string): string {
  if (!SCOPE_KEY_PATTERN.test(scopeKey)) {
    throw new Error(`Invalid metrics scope key: ${scopeKey}`);
  }
  return path.join(METRICS_DIR, `${scopeKey.replace(':', '_')}.json`);
}

export interface LatestMetricsOrigin {
  source: 'file' | 'jira-api';
  connectionName?: string;
  connectionId?: string;
}

export function writeLatestMetrics(scopeKey: string, metrics: unknown, origin?: LatestMetricsOrigin): void {
  fs.mkdirSync(METRICS_DIR, { recursive: true });
  fs.writeFileSync(metricsFilePath(scopeKey), JSON.stringify({
    savedAt: new Date().toISOString(),
    metrics,
    origin: origin ?? null,
  }, null, 2), 'utf8');
}

export function readLatestMetrics(scopeKey: string): { savedAt: string; metrics: unknown; origin: LatestMetricsOrigin | null } | null {
  // Validated outside the try/catch below: an invalid scope key is a
  // programming error upstream and should fail loudly, not be swallowed
  // alongside genuine file-read/corruption failures.
  const filePath = metricsFilePath(scopeKey);
  try {
    if (!fs.existsSync(filePath)) return null;
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!parsed?.metrics) return null;
    return {
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
      metrics: parsed.metrics,
      origin: parsed.origin && typeof parsed.origin === 'object' ? parsed.origin : null,
    };
  } catch {
    return null;
  }
}

/** Every scoped metrics file currently on disk — used by backup.service.ts
 * to include them all in cloud backups without a fixed file list. */
export function listMetricsScopeFiles(): string[] {
  try {
    if (!fs.existsSync(METRICS_DIR)) return [];
    return fs.readdirSync(METRICS_DIR).filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
}

export function metricsScopeFileDir(): string {
  return METRICS_DIR;
}
