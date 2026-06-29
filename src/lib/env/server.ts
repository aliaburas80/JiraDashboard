// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Server-only environment validation. Do not import this from Client Components.

import { normalizeAppUrl } from '@/lib/url';

export type StorageDriver = 'temporary' | 's3' | 'azure' | 'gcp';

export interface ServerEnv {
  NODE_ENV: string;
  DATABASE_URL: string;
  PORT: string;
  APP_URL: string;
  SESSION_SECRET: string;
  CONFIG_ENCRYPTION_KEY: string;
  STORAGE_DRIVER: StorageDriver;
  STORAGE_BUCKET?: string;
  STORAGE_REGION?: string;
  STORAGE_ENDPOINT?: string;
  STORAGE_ACCESS_KEY_ID?: string;
  STORAGE_SECRET_ACCESS_KEY?: string;
  MAX_UPLOAD_MB: number;
  LOG_LEVEL: string;
}

const STORAGE_DRIVERS = new Set<StorageDriver>(['temporary', 's3', 'azure', 'gcp']);

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requireInProduction(name: string, value: string | undefined, errors: string[]): string {
  if (process.env.NODE_ENV === 'production' && !value) {
    errors.push(`${name} is required in production.`);
  }
  return value ?? '';
}

function readUploadLimit(errors: string[]): number {
  const raw = read('MAX_UPLOAD_MB') ?? '20';
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    errors.push('MAX_UPLOAD_MB must be a number between 1 and 100.');
    return 20;
  }
  return value;
}

export function getServerEnv(): ServerEnv {
  const errors: string[] = [];
  const storageDriverRaw = read('STORAGE_DRIVER') ?? 'temporary';
  const storageDriver = STORAGE_DRIVERS.has(storageDriverRaw as StorageDriver)
    ? storageDriverRaw as StorageDriver
    : 'temporary';

  if (!STORAGE_DRIVERS.has(storageDriverRaw as StorageDriver)) {
    errors.push('STORAGE_DRIVER must be one of: temporary, s3, azure, gcp.');
  }

  if (process.env.NODE_ENV === 'production') {
    if ((read('DATABASE_URL') ?? '').startsWith('file:')) {
      errors.push('DATABASE_URL must be a PostgreSQL connection string in production.');
    }
    if (storageDriver === 'temporary') {
      errors.push('STORAGE_DRIVER must use persistent object storage in production.');
    }
  }

  if (storageDriver === 's3' && process.env.NODE_ENV === 'production') {
    requireInProduction('STORAGE_BUCKET', read('STORAGE_BUCKET'), errors);
    requireInProduction('STORAGE_REGION', read('STORAGE_REGION'), errors);
    const hasStorageCredentials = !!(
      read('STORAGE_ACCESS_KEY_ID') && read('STORAGE_SECRET_ACCESS_KEY')
    );
    const hasAwsCredentials = !!(
      read('AWS_ACCESS_KEY_ID') && read('AWS_SECRET_ACCESS_KEY')
    );
    if (!hasStorageCredentials && !hasAwsCredentials) {
      errors.push(
        'S3 storage requires STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY in production.',
      );
    }
  }

  const env: ServerEnv = {
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    DATABASE_URL: requireInProduction('DATABASE_URL', read('DATABASE_URL'), errors),
    PORT: read('PORT') ?? '3000',
    APP_URL: normalizeAppUrl(read('APP_URL') ?? read('NEXT_PUBLIC_APP_URL')),
    SESSION_SECRET: requireInProduction('SESSION_SECRET', read('SESSION_SECRET'), errors),
    CONFIG_ENCRYPTION_KEY: requireInProduction('CONFIG_ENCRYPTION_KEY', read('CONFIG_ENCRYPTION_KEY'), errors),
    STORAGE_DRIVER: storageDriver,
    STORAGE_BUCKET: read('STORAGE_BUCKET'),
    STORAGE_REGION: read('STORAGE_REGION'),
    STORAGE_ENDPOINT: read('STORAGE_ENDPOINT'),
    STORAGE_ACCESS_KEY_ID: read('STORAGE_ACCESS_KEY_ID'),
    STORAGE_SECRET_ACCESS_KEY: read('STORAGE_SECRET_ACCESS_KEY'),
    MAX_UPLOAD_MB: readUploadLimit(errors),
    LOG_LEVEL: read('LOG_LEVEL') ?? 'info',
  };

  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters.');
  }
  if (env.CONFIG_ENCRYPTION_KEY && env.CONFIG_ENCRYPTION_KEY.length < 32) {
    errors.push('CONFIG_ENCRYPTION_KEY must be at least 32 characters.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid server environment: ${errors.join(' ')}`);
  }

  return env;
}
