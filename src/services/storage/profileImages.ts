// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Profile image storage in the active S3 bucket.

import { readStorageSettings } from '@/services/storage/storageProvider';

export const PROFILE_IMAGE_PREFIX = 'images/profile';

function cleanPrefix(prefix?: string): string {
  return prefix?.trim().replace(/^\/+|\/+$/g, '') ?? '';
}

function extensionFor(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'image/gif': return 'gif';
    default: return 'bin';
  }
}

function assertS3Settings() {
  const settings = readStorageSettings();
  if (settings.active !== 's3') {
    throw new Error('Profile image upload requires Amazon S3 to be the active cloud storage provider.');
  }
  if (!settings.s3.bucket) {
    throw new Error('S3 bucket name is required before profile images can be uploaded.');
  }
  return settings.s3;
}

async function getS3Client() {
  const config = assertS3Settings();
  const { S3Client, PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3');
  const hasExplicitCreds = !!(config.accessKeyId?.trim() && config.secretAccessKey?.trim());
  const client = new S3Client({
    region: config.region || 'us-east-1',
    ...(hasExplicitCreds ? { credentials: { accessKeyId: config.accessKeyId!, secretAccessKey: config.secretAccessKey! } } : {}),
    ...(config.endpoint ? { endpoint: config.endpoint, forcePathStyle: true } : {}),
  });
  return { client, PutObjectCommand, GetObjectCommand, config };
}

function buildProfileImageKey(userId: string, contentType: string): string {
  const config = assertS3Settings();
  const prefix = cleanPrefix(config.prefix);
  const ext = extensionFor(contentType);
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `${safeUserId}-${Date.now()}.${ext}`;
  return [prefix, PROFILE_IMAGE_PREFIX, filename].filter(Boolean).join('/');
}

export function isProfileImageKey(key: string): boolean {
  const config = assertS3Settings();
  const prefix = cleanPrefix(config.prefix);
  const expected = [prefix, PROFILE_IMAGE_PREFIX].filter(Boolean).join('/');
  return key === expected || key.startsWith(`${expected}/`);
}

export async function uploadProfileImageToS3(params: {
  userId: string;
  content: Buffer;
  contentType: string;
}): Promise<{ key: string }> {
  const { client, PutObjectCommand, config } = await getS3Client();
  const key = buildProfileImageKey(params.userId, params.contentType);
  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: params.content,
    ContentType: params.contentType,
    CacheControl: 'private, max-age=3600',
  }));
  return { key };
}

export async function downloadProfileImageFromS3(key: string): Promise<{ body: Buffer; contentType: string }> {
  if (!isProfileImageKey(key)) throw new Error('Invalid profile image key.');
  const { client, GetObjectCommand, config } = await getS3Client();
  const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
  const chunks: Buffer[] = [];
  const stream = response.Body as AsyncIterable<Buffer | Uint8Array | string>;
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return {
    body: Buffer.concat(chunks),
    contentType: response.ContentType ?? 'application/octet-stream',
  };
}
