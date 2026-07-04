// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Database backup and restore service.
// Exports the SQLite database + JSON config files into a downloadable
// backup bundle, and restores from a previously created backup.

import fs   from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Files included in every backup
const BACKUP_FILES = [
  { name: 'delivery_clarity.db',     label: 'SQLite database'         },
  { name: 'latest-metrics.json',     label: 'Latest dashboard metrics' },
  { name: 'health-thresholds.json',  label: 'Health threshold config' },
  { name: 'retention-settings.json', label: 'Retention settings'      },
  { name: 'orphan-rules.json',       label: 'Orphan detection rules'  },
  { name: 'import-logs.json',        label: 'File-based import logs'  },
];

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
  const allowedNames = new Set(BACKUP_FILES.map(f => f.name));

  for (const [filename, b64Content] of Object.entries(bundle.files ?? {})) {
    if (!allowedNames.has(filename)) {
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
      fs.mkdirSync(DATA_DIR, { recursive: true });
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
  return BACKUP_FILES.map(f => {
    const fp  = path.join(DATA_DIR, f.name);
    const exists = fs.existsSync(fp);
    return {
      name:     f.name,
      label:    f.label,
      size:     exists ? fs.statSync(fp).size : 0,
      included: exists,
    };
  });
}
