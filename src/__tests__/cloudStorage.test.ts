// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Cloud storage tests — TC-CS-01 to TC-CS-08

import {
  readStorageSettings,
  writeStorageSettings,
  PROVIDER_INFO,
} from '../services/storage/storageProvider';
import type { StorageSettings } from '../types/storage';

// ── Mock fs so tests don't touch the real filesystem ─────────────────────────

const mockFiles: Record<string, string> = {};

jest.mock('fs', () => ({
  existsSync:    (p: string) => p in mockFiles,
  readFileSync:  (p: string) => mockFiles[p],
  writeFileSync: (p: string, content: string) => { mockFiles[p] = content; },
  mkdirSync:     () => {},
  readdirSync:   () => [],
  statSync:      () => ({ size: 0, mtime: new Date() }),
  unlinkSync:    () => {},
}));

beforeEach(() => {
  Object.keys(mockFiles).forEach(k => delete mockFiles[k]);
});

// ── TC-CS-01: readStorageSettings returns defaults when no file ───────────────

test('TC-CS-01: readStorageSettings returns defaults when settings file missing', () => {
  const s = readStorageSettings();
  expect(s.active).toBe('local');
  expect(s.s3).toBeDefined();
  expect(s.azure).toBeDefined();
  expect(s.gcp).toBeDefined();
});

// ── TC-CS-02: writeStorageSettings persists and readStorageSettings reads ─────

test('TC-CS-02: writeStorageSettings persists; readStorageSettings retrieves', () => {
  const settings: StorageSettings = {
    active: 's3',
    local:  { provider: 'local' },
    s3:     { bucket: 'my-bucket', region: 'eu-west-1', accessKeyId: 'AK', secretAccessKey: 'SK' },
    azure:  {},
    gcp:    {},
    updatedAt: '2026-06-05T00:00:00.000Z',
    updatedBy: 'admin@test.com',
  };
  writeStorageSettings(settings);
  const loaded = readStorageSettings();
  expect(loaded.active).toBe('s3');
  expect(loaded.s3.bucket).toBe('my-bucket');
  expect(loaded.s3.region).toBe('eu-west-1');
  expect(loaded.updatedBy).toBe('admin@test.com');
});

test('TC-CS-02b: response-only credential flags are stripped from saved settings', () => {
  writeStorageSettings({
    active: 's3',
    local:  { provider: 'local' },
    s3:     { bucket: 'my-bucket', region: 'eu-west-1', accessKeyId: '', secretAccessKey: '', hasCredentials: true } as any,
    azure:  { containerName: 'container', hasCredentials: true } as any,
    gcp:    { bucket: 'gcp-bucket', projectId: 'project', hasCredentials: true } as any,
  });

  const raw = Object.values(mockFiles)[0];
  expect(raw).not.toContain('hasCredentials');

  const loaded = readStorageSettings();
  expect((loaded.s3 as any).hasCredentials).toBeUndefined();
  expect((loaded.azure as any).hasCredentials).toBeUndefined();
  expect((loaded.gcp as any).hasCredentials).toBeUndefined();
});

// ── TC-CS-03: PROVIDER_INFO has 4 entries ─────────────────────────────────────

test('TC-CS-03: PROVIDER_INFO has entries for local, s3, azure, gcp', () => {
  expect(Object.keys(PROVIDER_INFO)).toEqual(['local', 's3', 'azure', 'gcp']);
  Object.values(PROVIDER_INFO).forEach(info => {
    expect(info.label.length).toBeGreaterThan(0);
    expect(info.icon.length).toBeGreaterThan(0);
    expect(info.description.length).toBeGreaterThan(0);
  });
});

// ── TC-CS-04: S3 provider has installCmd; local does not ─────────────────────

test('TC-CS-04: s3/azure/gcp have installCmd; local has empty installCmd', () => {
  expect(PROVIDER_INFO.local.installCmd).toBe('');
  expect(PROVIDER_INFO.s3.installCmd).toContain('@aws-sdk/client-s3');
  expect(PROVIDER_INFO.azure.installCmd).toContain('@azure/storage-blob');
  expect(PROVIDER_INFO.gcp.installCmd).toContain('@google-cloud/storage');
});

// ── TC-CS-05: Partial S3 settings merged with defaults ───────────────────────

test('TC-CS-05: partial S3 config merged with existing defaults', () => {
  writeStorageSettings({
    active: 'local', local: { provider: 'local' },
    s3: { bucket: 'test-bucket' }, azure: {}, gcp: {},
  });
  const loaded = readStorageSettings();
  expect(loaded.s3.bucket).toBe('test-bucket');
  expect(loaded.active).toBe('local'); // default still applied
});

// ── TC-CS-06: StorageSettings type has all required fields ───────────────────

test('TC-CS-06: StorageSettings default includes active, local, s3, azure, gcp', () => {
  const s = readStorageSettings();
  expect('active'   in s).toBe(true);
  expect('local'    in s).toBe(true);
  expect('s3'       in s).toBe(true);
  expect('azure'    in s).toBe(true);
  expect('gcp'      in s).toBe(true);
});

// ── TC-CS-07: readStorageSettings merges saved with defaults ─────────────────

test('TC-CS-07: readStorageSettings merges partial saved data with DEFAULTS', () => {
  // Write only active — no s3/azure/gcp fields
  writeStorageSettings({ active: 'azure', local: { provider: 'local' }, s3: {}, azure: { containerName: 'my-container' }, gcp: {} });
  const s = readStorageSettings();
  expect(s.active).toBe('azure');
  expect(s.azure.containerName).toBe('my-container');
  expect(s.s3).toBeDefined(); // s3 still present from defaults
});

// ── TC-CS-08: LocalStorageProvider.test() resolves with ok:true ──────────────

test('TC-CS-08: LocalStorageProvider.test() returns { ok: true }', async () => {
  const { LocalStorageProvider } = await import('../services/storage/providers/localProvider');
  const provider = new LocalStorageProvider();
  const result   = await provider.test();
  expect(result.ok).toBe(true);
  expect(provider.type).toBe('local');
});
