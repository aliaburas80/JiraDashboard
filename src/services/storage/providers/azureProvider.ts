// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Azure Blob Storage provider.
//
// Credential resolution order (same pattern as S3):
//  1. connectionString from form (explicit — highest priority)
//  2. AZURE_STORAGE_CONNECTION_STRING environment variable
//  3. Error — cannot connect without either

import { BlobServiceClient } from '@azure/storage-blob';
import type { StorageProvider, CloudObject, AzureStorageConfig } from '@/types/storage';
import { explainStorageError } from '@/services/storage/storageErrors';

export class AzureStorageProvider implements StorageProvider {
  readonly type = 'azure' as const;
  private config: AzureStorageConfig;

  constructor(config: AzureStorageConfig) {
    this.config = config;
  }

  private getClient() {
    // Prefer explicit connection string, fall back to env var
    const connStr =
      this.config.connectionString?.trim() ||
      process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();

    if (!connStr) {
      throw new Error(
        'Azure: No connection string provided. ' +
        'Set it in the form OR set the AZURE_STORAGE_CONNECTION_STRING environment variable.'
      );
    }

    // Validate format before calling SDK — catches "Invalid URL" early
    if (!connStr.startsWith('DefaultEndpointsProtocol=') && !connStr.startsWith('AccountName=') && !connStr.includes('AccountKey=')) {
      throw new Error(
        'The connection string format is invalid. ' +
        'Azure connection strings must start with "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...". ' +
        'Copy it from: Azure Portal → Storage Account → Access keys → key1 → Connection string.'
      );
    }

    const service   = BlobServiceClient.fromConnectionString(connStr);
    const container = service.getContainerClient(this.config.containerName);
    return { service, container };
  }

  private prefixed(key: string): string {
    return this.config.prefix ? `${this.config.prefix.replace(/\/$/, '')}/${key}` : key;
  }

  async upload(key: string, content: Buffer | string): Promise<string> {
    const { container } = this.getClient();
    const blobName = this.prefixed(key);
    const buf = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    await container.getBlockBlobClient(blobName).uploadData(buf, {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    return blobName;
  }

  async download(key: string): Promise<string> {
    const { container } = this.getClient();
    const resp = await container.getBlockBlobClient(key).downloadToBuffer();
    return resp.toString('utf-8');
  }

  async list(prefix?: string): Promise<CloudObject[]> {
    const { container } = this.getClient();
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
    const { container } = this.getClient();
    await container.getBlockBlobClient(key).delete();
  }

  async test(): Promise<{ ok: true } | { ok: false; error: string; cause?: string; fix?: string }> {
    try {
      const { container } = this.getClient();
      await container.getProperties();
      return { ok: true };
    } catch (e: unknown) {
      const { raw, cause, fix } = explainStorageError(e);
      return { ok: false, error: raw, cause, fix };
    }
  }
}
