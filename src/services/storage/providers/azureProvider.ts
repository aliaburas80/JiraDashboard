// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Azure Blob Storage provider.
// Requires: npm install @azure/storage-blob
// The SDK is loaded dynamically so the app starts without it installed.

import type { StorageProvider, CloudObject, AzureStorageConfig } from '@/types/storage';

export class AzureStorageProvider implements StorageProvider {
  readonly type = 'azure' as const;
  private config: AzureStorageConfig;

  constructor(config: AzureStorageConfig) {
    this.config = config;
  }

  private async getClient() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — optional peer dependency; installed separately when Azure is used
    const { BlobServiceClient } = await import(/* webpackIgnore: true */ '@azure/storage-blob' as string).catch(() => {
      throw new Error('Azure SDK not installed. Run: npm install @azure/storage-blob');
    }) as any;
    const service   = BlobServiceClient.fromConnectionString(this.config.connectionString);
    const container = service.getContainerClient(this.config.containerName);
    return { container, BlobServiceClient };
  }

  private prefixed(key: string): string {
    return this.config.prefix ? `${this.config.prefix.replace(/\/$/, '')}/${key}` : key;
  }

  async upload(key: string, content: Buffer | string): Promise<string> {
    const { container } = await this.getClient();
    const blobName = this.prefixed(key);
    const buf = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    await container.getBlockBlobClient(blobName).uploadData(buf, { blobHTTPHeaders: { blobContentType: 'application/json' } });
    return blobName;
  }

  async download(key: string): Promise<string> {
    const { container } = await this.getClient();
    const resp = await container.getBlockBlobClient(key).downloadToBuffer();
    return resp.toString('utf-8');
  }

  async list(prefix?: string): Promise<CloudObject[]> {
    const { container } = await this.getClient();
    const p = prefix ?? this.config.prefix ?? '';
    const results: CloudObject[] = [];
    for await (const blob of container.listBlobsFlat({ prefix: p })) {
      results.push({
        key:          blob.name,
        size:         blob.properties.contentLength ?? 0,
        lastModified: blob.properties.lastModified?.toISOString() ?? '',
      });
    }
    return results;
  }

  async delete(key: string): Promise<void> {
    const { container } = await this.getClient();
    await container.getBlockBlobClient(key).delete();
  }

  async test(): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const { container } = await this.getClient();
      await container.exists();
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
