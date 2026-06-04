// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Google Cloud Storage provider.
// Requires: npm install @google-cloud/storage
// The SDK is loaded dynamically so the app starts without it installed.

import type { StorageProvider, CloudObject, GcpStorageConfig } from '@/types/storage';

export class GcpStorageProvider implements StorageProvider {
  readonly type = 'gcp' as const;
  private config: GcpStorageConfig;

  constructor(config: GcpStorageConfig) {
    this.config = config;
  }

  private async getBucket() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — optional peer dependency; installed separately when GCP is used
    const { Storage } = await import(/* webpackIgnore: true */ '@google-cloud/storage' as string).catch(() => {
      throw new Error('GCP SDK not installed. Run: npm install @google-cloud/storage');
    }) as any;

    const storageOpts: Record<string, unknown> = { projectId: this.config.projectId };
    if (this.config.keyFilename) storageOpts.keyFilename = this.config.keyFilename;
    if (this.config.keyJson)     storageOpts.credentials  = JSON.parse(this.config.keyJson);

    const storage = new Storage(storageOpts);
    return storage.bucket(this.config.bucket);
  }

  private prefixed(key: string): string {
    return this.config.prefix ? `${this.config.prefix.replace(/\/$/, '')}/${key}` : key;
  }

  async upload(key: string, content: Buffer | string): Promise<string> {
    const bucket = await this.getBucket();
    const remoteKey = this.prefixed(key);
    const file = bucket.file(remoteKey);
    await file.save(typeof content === 'string' ? Buffer.from(content, 'utf-8') : content, { contentType: 'application/json' });
    return remoteKey;
  }

  async download(key: string): Promise<string> {
    const bucket = await this.getBucket();
    const [content] = await bucket.file(key).download();
    return content.toString('utf-8');
  }

  async list(prefix?: string): Promise<CloudObject[]> {
    const bucket = await this.getBucket();
    const p = prefix ?? this.config.prefix ?? '';
    const [files] = await bucket.getFiles({ prefix: p });
    return files.map(f => ({
      key:          f.name,
      size:         Number(f.metadata.size ?? 0),
      lastModified: f.metadata.updated ?? '',
    }));
  }

  async delete(key: string): Promise<void> {
    const bucket = await this.getBucket();
    await bucket.file(key).delete();
  }

  async test(): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const bucket = await this.getBucket();
      await bucket.exists();
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
