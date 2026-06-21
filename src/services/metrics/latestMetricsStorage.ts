// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Server-side copy of the latest dashboard metrics. This file is included in
// cloud backups so a fresh session can load dashboard data from the bucket
// before falling back to browser localStorage.

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LATEST_METRICS_FILE = path.join(DATA_DIR, 'latest-metrics.json');

export interface LatestMetricsOrigin {
  source: 'file' | 'jira-api';
  connectionName?: string;
  connectionId?: string;
}

export function writeLatestMetrics(metrics: unknown, origin?: LatestMetricsOrigin): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LATEST_METRICS_FILE, JSON.stringify({
    savedAt: new Date().toISOString(),
    metrics,
    origin: origin ?? null,
  }, null, 2), 'utf8');
}

export function readLatestMetrics(): { savedAt: string; metrics: unknown; origin: LatestMetricsOrigin | null } | null {
  try {
    if (!fs.existsSync(LATEST_METRICS_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(LATEST_METRICS_FILE, 'utf8'));
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
