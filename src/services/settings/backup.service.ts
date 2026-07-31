// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Configuration and diagnostics backup/restore service.
// Exports local admin-configurable JSON files (health thresholds, retention
// settings, orphan-detection rules, cloud-storage provider settings, and
// per-workspace metrics cache) into a downloadable bundle, and restores from
// a previously created one.
//
// This does NOT back up the application database — the database is external
// PostgreSQL (Neon in production); see product/DATABASE_BACKUP_RESTORE.md
// for actual data recovery (P0A-06).
//
// EP-020: dashboard metrics moved from one shared `latest-metrics.json` file
// to one file per workspace/user under `data/metrics/` — the fixed file list
// below can't name those ahead of time, so they're discovered dynamically
// (see listMetricsScopeFiles()) and included individually in every backup.

import fs   from 'fs';
import path from 'path';
import { listMetricsScopeFiles, metricsScopeFileDir } from '@/services/metrics/latestMetricsStorage';

const DATA_DIR = path.join(process.cwd(), 'data');

// Fixed files included in every backup (excludes per-scope metrics files —
// see METRICS_SCOPE_FILE_PATTERN below).
const BACKUP_FILES = [
  { name: 'health-thresholds.json',  label: 'Health threshold config' },
  { name: 'retention-settings.json', label: 'Retention settings'      },
  { name: 'orphan-rules.json',       label: 'Orphan detection rules'  },
  { name: 'import-logs.json',        label: 'File-based import logs'  },
];

// Legacy single-file name from before EP-020 — no longer written, but still
// allowed on restore so a pre-existing backup doesn't fail/skip loudly.
const LEGACY_LATEST_METRICS_FILE = 'latest-metrics.json';

// Matches `metrics/ws_<id>.json` / `metrics/user_<id>.json` — mirrors the
// scope-key sanitization in latestMetricsStorage.ts.
const METRICS_SCOPE_FILE_PATTERN = /^metrics\/(ws|user)_[a-zA-Z0-9_-]+\.json$/;

export interface BackupManifest {
  version:    string;
  createdAt:  string;
  files:      { name: string; label: string; size: number; included: boolean }[];
  totalSize:  number;
}

export interface BackupBundle {
  manifest: BackupManifest;
  files:    Record<string, string>; // filename → base64-encoded content
}

// ── Create backup ─────────────────────────────────────────────────────────────

export function createBackup(): BackupBundle {
  const files: Record<string, string> = {};
  const manifestFiles: BackupManifest['files'] = [];
  let totalSize = 0;

  for (const f of BACKUP_FILES) {
    const filePath = path.join(DATA_DIR, f.name);
    const exists   = fs.existsSync(filePath);
    if (exists) {
      const buf  = fs.readFileSync(filePath);
      const b64  = buf.toString('base64');
      files[f.name] = b64;
      manifestFiles.push({ name: f.name, label: f.label, size: buf.length, included: true });
      totalSize += buf.length;
    } else {
      manifestFiles.push({ name: f.name, label: f.label, size: 0, included: false });
    }
  }

  // EP-020: include every per-workspace/user metrics file individually —
  // discovered dynamically since the set of workspaces isn't known ahead of time.
  for (const name of listMetricsScopeFiles()) {
    const filePath = path.join(metricsScopeFileDir(), name);
    const buf = fs.readFileSync(filePath);
    const key = `metrics/${name}`;
    files[key] = buf.toString('base64');
    manifestFiles.push({ name: key, label: 'Workspace dashboard metrics', size: buf.length, included: true });
    totalSize += buf.length;
  }

  const manifest: BackupManifest = {
    version:   '1.0',
    createdAt: new Date().toISOString(),
    files:     manifestFiles,
    totalSize,
  };

  return { manifest, files };
}

// ── Restore backup ────────────────────────────────────────────────────────────

export interface RestoreResult {
  success:  boolean;
  restored: string[];
  skipped:  string[];
  errors:   string[];
}

export function restoreBackup(bundle: BackupBundle): RestoreResult {
  const restored: string[] = [];
  const skipped:  string[] = [];
  const errors:   string[] = [];

  // Validate manifest
  if (!bundle.manifest?.version || !bundle.manifest?.createdAt) {
    return { success: false, restored, skipped, errors: ['Invalid backup — missing manifest.'] };
  }

  // Only restore files we know about (security: never write arbitrary paths)
  const allowedNames = new Set([...BACKUP_FILES.map(f => f.name), LEGACY_LATEST_METRICS_FILE]);

  for (const [filename, b64Content] of Object.entries(bundle.files ?? {})) {
    const isFixedFile   = allowedNames.has(filename);
    const isScopedMetric = METRICS_SCOPE_FILE_PATTERN.test(filename);
    if (!isFixedFile && !isScopedMetric) {
      skipped.push(`${filename} (not in allowed list)`);
      continue;
    }
    try {
      const buf      = Buffer.from(b64Content, 'base64');
      const filePath = path.join(DATA_DIR, filename);
      // Create a .bak of the current file before overwriting
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, filePath + '.bak');
      }
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buf);
      restored.push(filename);
    } catch (err) {
      errors.push(`${filename}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { success: errors.length === 0, restored, skipped, errors };
}

// ── Backup stats (for UI display) ─────────────────────────────────────────────

export function getBackupStats(): BackupManifest['files'] {
  const fixed = BACKUP_FILES.map(f => {
    const fp  = path.join(DATA_DIR, f.name);
    const exists = fs.existsSync(fp);
    return {
      name:     f.name,
      label:    f.label,
      size:     exists ? fs.statSync(fp).size : 0,
      included: exists,
    };
  });

  const scoped = listMetricsScopeFiles().map(name => {
    const fp = path.join(metricsScopeFileDir(), name);
    return {
      name:     `metrics/${name}`,
      label:    'Workspace dashboard metrics',
      size:     fs.statSync(fp).size,
      included: true,
    };
  });

  return [...fixed, ...scoped];
}
