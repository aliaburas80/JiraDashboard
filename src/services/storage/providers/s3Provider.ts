// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// AWS S3 storage provider (also compatible with MinIO, Backblaze B2, Cloudflare R2).
// Requires: npm install @aws-sdk/client-s3
// The SDK is loaded dynamically so the app starts without it installed.

import type { StorageProvider, CloudObject, S3StorageConfig } from '@/types/storage';
import { explainStorageError } from '@/services/storage/storageErrors';

export class S3StorageProvider implements StorageProvider {
  readonly type = 's3' as const;
  private config: S3StorageConfig;

  constructor(config: S3StorageConfig) {
    this.config = config;
  }

  private async getClient() {
    // Dynamic import — S3 SDK only loaded when this provider is active
    const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } =
      await import('@aws-sdk/client-s3');

    // Only pass explicit credentials when both fields are non-empty.
    // When empty, the SDK falls back to the default credential chain:
    //   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars → ~/.aws/credentials → IAM role
    const hasExplicitCreds = !!(this.config.accessKeyId?.trim() && this.config.secretAccessKey?.trim());

    const client = new S3Client({
      region: this.config.region || 'us-east-1',
      ...(hasExplicitCreds ? { credentials: { accessKeyId: this.config.accessKeyId, secretAccessKey: this.config.secretAccessKey } } : {}),
      ...(this.config.endpoint ? { endpoint: this.config.endpoint, forcePathStyle: true } : {}),
    });

    return { client, S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand };
  }

  private prefixed(key: string): string {
    return this.config.prefix ? `${this.config.prefix.replace(/\/$/, '')}/${key}` : key;
  }

  async upload(key: string, content: Buffer | string, contentType = 'application/json'): Promise<string> {
    const { client, PutObjectCommand } = await this.getClient();
    const remoteKey = this.prefixed(key);
    await client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key:    remoteKey,
      Body:   typeof content === 'string' ? Buffer.from(content, 'utf-8') : content,
      ContentType: contentType,
    }));
    return remoteKey;
  }

  async download(key: string): Promise<string> {
    const { client, GetObjectCommand } = await this.getClient();
    const resp = await client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: key }));
    const stream = resp.Body as any;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf-8');
  }

  async list(prefix?: string): Promise<CloudObject[]> {
    const { client, ListObjectsV2Command } = await this.getClient();
    const p = prefix ?? this.config.prefix ?? '';
    const resp = await client.send(new ListObjectsV2Command({ Bucket: this.config.bucket, Prefix: p }));
    return (resp.Contents ?? []).map(obj => ({
      key:          obj.Key ?? '',
      size:         obj.Size ?? 0,
      lastModified: obj.LastModified?.toISOString() ?? '',
    }));
  }

  async delete(key: string): Promise<void> {
    const { client, DeleteObjectCommand } = await this.getClient();
    await client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  async test(): Promise<{ ok: true } | { ok: false; error: string; cause?: string; fix?: string }> {
    try {
      await this.list(this.config.prefix);
      return { ok: true };
    } catch (e: unknown) {
      const { raw, cause, fix } = explainStorageError(e);
      return { ok: false, error: raw, cause, fix };
    }
  }
}
