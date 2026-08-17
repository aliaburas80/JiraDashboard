// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import { createHash, randomBytes } from 'node:crypto';

export function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashShareToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
