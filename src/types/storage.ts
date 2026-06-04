// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Cloud storage provider types — P3-01.

export type StorageProviderType = 'local' | 's3' | 'azure' | 'gcp';

// ── Per-provider config shapes ────────────────────────────────────────────────

export interface LocalStorageConfig {
  provider: 'local';
}

export interface S3StorageConfig {
  provider:        's3';
  bucket:          string;
  region:          string;
  accessKeyId:     string;
  secretAccessKey: string;
  prefix?:         string;   // optional folder prefix inside bucket
  endpoint?:       string;   // for S3-compatible APIs (MinIO, Backblaze, etc.)
}

export interface AzureStorageConfig {
  provider:           'azure';
  containerName:      string;
  connectionString:   string;
  prefix?:            string;
}

export interface GcpStorageConfig {
  provider:           'gcp';
  bucket:             string;
  projectId:          string;
  keyFilename?:       string;   // path to service account JSON
  keyJson?:           string;   // inline service account JSON (alternative)
  prefix?:            string;
}

export type StorageConfig =
  | LocalStorageConfig
  | S3StorageConfig
  | AzureStorageConfig
  | GcpStorageConfig;

// ── Stored settings file shape ─────────────────────────────────────────────────

export interface StorageSettings {
  active:      StorageProviderType;
  local:       LocalStorageConfig;
  s3:          Partial<Omit<S3StorageConfig, 'provider'>>;
  azure:       Partial<Omit<AzureStorageConfig, 'provider'>>;
  gcp:         Partial<Omit<GcpStorageConfig, 'provider'>>;
  updatedAt?:  string;
  updatedBy?:  string;
}

// ── Provider interface ────────────────────────────────────────────────────────

export interface CloudObject {
  key:          string;   // object key / path in the bucket/container
  size:         number;   // bytes
  lastModified: string;   // ISO date
  url?:         string;   // presigned or public URL if available
}

export interface StorageProvider {
  /** Provider identifier */
  readonly type: StorageProviderType;

  /** Upload a file. Returns the remote key on success. */
  upload(key: string, content: Buffer | string): Promise<string>;

  /** Download a file by key. Returns content as string. */
  download(key: string): Promise<string>;

  /** List objects under a prefix. */
  list(prefix?: string): Promise<CloudObject[]>;

  /** Delete an object by key. */
  delete(key: string): Promise<void>;

  /** Test connectivity — resolves with 'ok' or rejects with error message. */
  test(): Promise<{ ok: true } | { ok: false; error: string }>;
}
