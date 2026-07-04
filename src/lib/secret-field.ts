// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Small encrypted-secret helper for database fields. Stores only opaque
// AES-256-GCM envelopes; plaintext secrets must never be persisted.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KDF_SALT = 'dc-secret-field-v1';

function getSecret(): string {
  const secret = process.env.CONFIG_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('CONFIG_ENCRYPTION_KEY is required to encrypt or decrypt credentials.');
  }
  return secret;
}

function deriveKey(): Buffer {
  return scryptSync(getSecret(), KDF_SALT, 32) as Buffer;
}

export function encryptSecret(value: string): string {
  const key = deriveKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(encryptedValue: string): string {
  const buffer = Buffer.from(encryptedValue, 'base64');
  const iv = buffer.subarray(0, 16);
  const tag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);
  const decipher = createDecipheriv(ALGORITHM, deriveKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
}
