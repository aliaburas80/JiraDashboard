// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Storage provider factory and settings service.

import fs   from 'fs';
import path from 'path';
import type { StorageSettings, StorageProvider, StorageProviderType } from '@/types/storage';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'storage-settings.json');

// ── Default settings ──────────────────────────────────────────────────────────

const DEFAULTS: StorageSettings = {
  active: 'local',
  local:  { provider: 'local' },
  s3:     {},
  azure:  {},
  gcp:    {},
};

// ── Read / write ──────────────────────────────────────────────────────────────

export function readStorageSettings(): StorageSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return { ...DEFAULTS };
    return sanitizeStorageSettings({ ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) });
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeStorageSettings(settings: StorageSettings): void {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(sanitizeStorageSettings(settings), null, 2));
}

function stripResponseOnlyFields<T extends object>(config: T | undefined): Omit<T, 'hasCredentials'> | undefined {
  if (!config) return config;
  const { hasCredentials, ...rest } = config as T & { hasCredentials?: unknown };
  return rest;
}

function sanitizeStorageSettings(settings: StorageSettings): StorageSettings {
  return {
    ...settings,
    local: settings.local ?? DEFAULTS.local,
    s3: stripResponseOnlyFields(settings.s3) ?? {},
    azure: stripResponseOnlyFields(settings.azure) ?? {},
    gcp: stripResponseOnlyFields(settings.gcp) ?? {},
  };
}

// ── Provider factory ──────────────────────────────────────────────────────────

export async function getActiveProvider(): Promise<StorageProvider> {
  const settings = readStorageSettings();
  return createProvider(settings.active, settings);
}

export async function createProvider(type: StorageProviderType, settings: StorageSettings): Promise<StorageProvider> {
  switch (type) {
    case 's3': {
      const { S3StorageProvider } = await import('./providers/s3Provider');
      return new S3StorageProvider({ provider: 's3', ...settings.s3 as any });
    }
    case 'azure': {
      const { AzureStorageProvider } = await import('./providers/azureProvider');
      return new AzureStorageProvider({ provider: 'azure', ...settings.azure as any });
    }
    case 'gcp': {
      const { GcpStorageProvider } = await import('./providers/gcpProvider');
      return new GcpStorageProvider({ provider: 'gcp', ...settings.gcp as any });
    }
    default: {
      const { LocalStorageProvider } = await import('./providers/localProvider');
      return new LocalStorageProvider();
    }
  }
}

// ── Upload backup to active provider ─────────────────────────────────────────

export async function uploadBackupToCloud(filename: string, content: string): Promise<string> {
  const provider = await getActiveProvider();
  return provider.upload(filename, content);
}

// ── List backups from active provider ─────────────────────────────────────────

export async function listCloudBackups() {
  const provider = await getActiveProvider();
  return provider.list();
}

// ── Provider display info ─────────────────────────────────────────────────────

export const PROVIDER_INFO: Record<StorageProviderType, { label: string; icon: string; description: string; installCmd: string }> = {
  local: {
    label:       'Local Storage',
    icon:        'database',
    description: 'Saves backups to the data/cloud-backups/ directory on the server. No cloud credentials required.',
    installCmd:  '',
  },
  s3: {
    label:       'Amazon S3',
    icon:        'cloud',
    description: 'AWS S3 or any S3-compatible storage (MinIO, Backblaze B2, Cloudflare R2).',
    installCmd:  'npm install @aws-sdk/client-s3',
  },
  azure: {
    label:       'Azure Blob Storage',
    icon:        'cloudUpload',
    description: 'Microsoft Azure Blob Storage container.',
    installCmd:  'npm install @azure/storage-blob',
  },
  gcp: {
    label:       'Google Cloud Storage',
    icon:        'globe',
    description: 'Google Cloud Storage bucket.',
    installCmd:  'npm install @google-cloud/storage',
  },
};
