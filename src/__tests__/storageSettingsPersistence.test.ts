// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Storage settings persistence tests — credentials must survive redacted UI saves.

import type { StorageSettings } from '../types/storage';

const currentSettings: StorageSettings = {
  active: 's3',
  local:  { provider: 'local' },
  s3: {
    bucket:          'delivery-clarity',
    region:          'us-east-1',
    prefix:          'prod',
    accessKeyId:     'AKIA_SAVED',
    secretAccessKey: 'SECRET_SAVED',
  },
  azure: {
    containerName:    'saved-container',
    connectionString: 'AZURE_SAVED',
  },
  gcp: {
    bucket:      'saved-gcp',
    projectId:   'saved-project',
    keyFilename: '/secure/key.json',
    keyJson:     '{"saved":true}',
  },
};

function installRouteMocks(writeStorageSettings = jest.fn()) {
  jest.doMock('next/headers', () => ({ cookies: jest.fn() }));
  jest.doMock('iron-session', () => ({
    getIronSession: jest.fn(async () => ({
      isLoggedIn: true,
      role: 'admin',
      email: 'admin@deliveryclarity.com',
    })),
  }));
  jest.doMock('@/services/settings/backup.service', () => ({
    createBackup: jest.fn(() => ({ manifest: { files: [] }, files: {} })),
  }));
  jest.doMock('@/services/storage/storageProvider', () => ({
    readStorageSettings: jest.fn(() => currentSettings),
    writeStorageSettings,
    createProvider: jest.fn(),
    listCloudBackups: jest.fn(),
    PROVIDER_INFO: {},
  }));
  return { writeStorageSettings };
}

function requestWithBody(body: unknown) {
  return {
    nextUrl: new URL('http://localhost/api/admin/storage'),
    json: jest.fn(async () => body),
  } as any;
}

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

test('TC-CS-13: admin storage save preserves existing S3 credentials when redacted form sends blank values', async () => {
  const { writeStorageSettings } = installRouteMocks();
  const { POST } = await import('../../app/api/admin/storage/route');

  const response = await POST(requestWithBody({
    active: 's3',
    s3: {
      bucket:          'delivery-clarity',
      region:          'us-east-1',
      prefix:          'prod',
      accessKeyId:     '',
      secretAccessKey: '',
      hasCredentials:  true,
    },
  }));
  const body = await response.json();

  expect(body.ok).toBe(true);
  expect(writeStorageSettings).toHaveBeenCalledTimes(1);
  const saved = writeStorageSettings.mock.calls[0][0] as StorageSettings;
  expect(saved.active).toBe('s3');
  expect(saved.s3.accessKeyId).toBe('AKIA_SAVED');
  expect(saved.s3.secretAccessKey).toBe('SECRET_SAVED');
  expect((saved.s3 as any).hasCredentials).toBeUndefined();
});

test('TC-CS-14: admin storage save allows explicit replacement credentials', async () => {
  const { writeStorageSettings } = installRouteMocks();
  const { POST } = await import('../../app/api/admin/storage/route');

  const response = await POST(requestWithBody({
    active: 's3',
    s3: {
      bucket:          'delivery-clarity-new',
      region:          'eu-west-1',
      accessKeyId:     'AKIA_NEW',
      secretAccessKey: 'SECRET_NEW',
    },
  }));
  const body = await response.json();

  expect(body.ok).toBe(true);
  const saved = writeStorageSettings.mock.calls[0][0] as StorageSettings;
  expect(saved.s3.bucket).toBe('delivery-clarity-new');
  expect(saved.s3.region).toBe('eu-west-1');
  expect(saved.s3.accessKeyId).toBe('AKIA_NEW');
  expect(saved.s3.secretAccessKey).toBe('SECRET_NEW');
});

test('TC-CS-15: admin storage save preserves Azure and GCP secrets when redacted form sends blank values', async () => {
  const { writeStorageSettings } = installRouteMocks();
  const { POST } = await import('../../app/api/admin/storage/route');

  const response = await POST(requestWithBody({
    active: 'azure',
    azure: { containerName: 'saved-container', connectionString: '', hasCredentials: true },
    gcp: { bucket: 'saved-gcp', projectId: 'saved-project', keyFilename: '', keyJson: '', hasCredentials: true },
  }));
  const body = await response.json();

  expect(body.ok).toBe(true);
  const saved = writeStorageSettings.mock.calls[0][0] as StorageSettings;
  expect(saved.azure.connectionString).toBe('AZURE_SAVED');
  expect(saved.gcp.keyFilename).toBe('/secure/key.json');
  expect(saved.gcp.keyJson).toBe('{"saved":true}');
  expect((saved.azure as any).hasCredentials).toBeUndefined();
  expect((saved.gcp as any).hasCredentials).toBeUndefined();
});
