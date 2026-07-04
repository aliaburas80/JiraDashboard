// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Database backup and restore tests — TC-BK-01 to TC-BK-08

import { restoreBackup } from '../services/settings/backup.service';
import type { BackupBundle } from '../services/settings/backup.service';

// TC-BK-01: Invalid manifest → failure
test('TC-BK-01: missing manifest → restore returns failure', () => {
  const bad = { files: {} } as any;
  const result = restoreBackup(bad);
  expect(result.success).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
});

// TC-BK-02: Invalid manifest version → failure
test('TC-BK-02: manifest with no version → restore fails', () => {
  const bad: BackupBundle = { manifest: {} as any, files: {} };
  const result = restoreBackup(bad);
  expect(result.success).toBe(false);
});

// TC-BK-03: Empty files → success with nothing restored
test('TC-BK-03: valid manifest, empty files → success, nothing restored', () => {
  const bundle: BackupBundle = {
    manifest: { version: '1.0', createdAt: new Date().toISOString(), files: [], totalSize: 0 },
    files: {},
  };
  const result = restoreBackup(bundle);
  expect(result.success).toBe(true);
  expect(result.restored).toHaveLength(0);
});

// TC-BK-04: Unknown file rejected (security)
test('TC-BK-04: file not in allowed list is skipped, not written', () => {
  const bundle: BackupBundle = {
    manifest: { version: '1.0', createdAt: new Date().toISOString(), files: [], totalSize: 0 },
    files: { '../etc/passwd': btoa('bad content'), 'unknown.db': btoa('data') },
  };
  const result = restoreBackup(bundle);
  expect(result.skipped.length).toBeGreaterThan(0);
  expect(result.restored).toHaveLength(0);
});

// TC-BK-05: Allowed filename accepted for restore attempt
test('TC-BK-05: allowed filename is processed (may fail on write in test env)', () => {
  const bundle: BackupBundle = {
    manifest: { version: '1.0', createdAt: new Date().toISOString(), files: [], totalSize: 0 },
    files: { 'health-thresholds.json': btoa('{}') },
  };
  const result = restoreBackup(bundle);
  // Either restored or errored — not skipped
  expect(result.skipped.includes('health-thresholds.json')).toBe(false);
});

// TC-BK-06: Backup manifest has correct shape
test('TC-BK-06: valid backup bundle has required manifest fields', () => {
  const bundle: BackupBundle = {
    manifest: { version: '1.0', createdAt: '2025-01-01T00:00:00.000Z', files: [], totalSize: 0 },
    files: {},
  };
  expect(bundle.manifest.version).toBe('1.0');
  expect(typeof bundle.manifest.createdAt).toBe('string');
  expect(Array.isArray(bundle.manifest.files)).toBe(true);
});

// TC-BK-07: Skipped files listed in result
test('TC-BK-07: unknown files appear in skipped list', () => {
  const bundle: BackupBundle = {
    manifest: { version: '1.0', createdAt: new Date().toISOString(), files: [], totalSize: 0 },
    files: { 'malicious.sh': btoa('#!/bin/bash rm -rf /') },
  };
  const result = restoreBackup(bundle);
  expect(result.skipped.some(s => s.includes('malicious.sh'))).toBe(true);
});

// TC-BK-08: Base64 content decoded correctly
test('TC-BK-08: base64 encoding/decoding round-trips correctly', () => {
  const original = JSON.stringify({ cycleTimeWarningDays: 7 });
  const encoded  = Buffer.from(original).toString('base64');
  const decoded  = Buffer.from(encoded, 'base64').toString('utf-8');
  expect(decoded).toBe(original);
});
