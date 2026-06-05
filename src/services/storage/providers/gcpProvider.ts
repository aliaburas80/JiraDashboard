// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Google Cloud Storage provider.
//
// Credential resolution order (same pattern as S3):
//  1. keyJson (inline service account JSON from form) — highest priority
//  2. keyFilename (path to service account JSON file)
//  3. GOOGLE_APPLICATION_CREDENTIALS env var — picked up automatically by the SDK
//  4. Application Default Credentials (gcloud auth, metadata server on GCE/Cloud Run)

import { Storage } from '@google-cloud/storage';
import type { StorageProvider, CloudObject, GcpStorageConfig } from '@/types/storage';

export class GcpStorageProvider implements StorageProvider {
  readonly type = 'gcp' as const;
  private config: GcpStorageConfig;

  constructor(config: GcpStorageConfig) {
    this.config = config;
  }

  private getBucket() {
    const opts: Record<string, unknown> = {};

    if (this.config.projectId?.trim()) {
      opts.projectId = this.config.projectId.trim();
    }

    // Explicit inline JSON takes highest priority
    if (this.config.keyJson?.trim()) {
      try {
        opts.credentials = JSON.parse(this.config.keyJson);
      } catch {
        throw new Error('GCP: Service Account JSON is not valid JSON. Please paste the full contents of the .json file.');
      }
    } else if (this.config.keyFilename?.trim()) {
      opts.keyFilename = this.config.keyFilename.trim();
    }
    // If neither keyJson nor keyFilename → SDK uses GOOGLE_APPLICATION_CREDENTIALS or ADC automatically

    const storage = new Storage(opts);
    return storage.bucket(this.config.bucket);
  }

  private prefixed(key: string): string {
    return this.config.prefix ? `${this.config.prefix.replace(/\/$/, '')}/${key}` : key;
  }

  async upload(key: string, content: Buffer | string): Promise<string> {
    const bucket    = this.getBucket();
    const remoteKey = this.prefixed(key);
    await bucket.file(remoteKey).save(
      typeof content === 'string' ? Buffer.from(content, 'utf-8') : content,
      { contentType: 'application/json' }
    );
    return remoteKey;
  }

  async download(key: string): Promise<string> {
    const bucket  = this.getBucket();
    const [content] = await bucket.file(key).download();
    return content.toString('utf-8');
  }

  async list(prefix?: string): Promise<CloudObject[]> {
    const bucket = this.getBucket();
    const p = prefix ?? this.config.prefix ?? '';
    const [files] = await bucket.getFiles({ prefix: p });
    return files.map(f => ({
      key:          f.name,
      size:         Number(f.metadata.size ?? 0),
      lastModified: f.metadata.updated ?? '',
    }));
  }

  async delete(key: string): Promise<void> {
    const bucket = this.getBucket();
    await bucket.file(key).delete();
  }

  async test(): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const bucket = this.getBucket();
      const [exists] = await bucket.exists();
      if (!exists) return { ok: false, error: `GCP: Bucket "${this.config.bucket}" does not exist or is not accessible.` };
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
