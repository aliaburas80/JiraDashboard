// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Per-connection Jira credential handling. Tokens are stored encrypted on the
// JiraConnection row so each connection can authenticate as a different account.

import type { JiraConnection } from '@prisma/client';
import { decryptSecret, encryptSecret } from '@/lib/secret-field';

type JiraCredentialConnection = Pick<JiraConnection, 'apiTokenEncrypted'>;

function normalizeJiraToken(token: string): string {
  const trimmed = token.trim();
  const cloudTokenStart = trimmed.indexOf('ATATT');

  if (cloudTokenStart > 0 && trimmed.slice(0, cloudTokenStart).includes(':')) {
    return trimmed.slice(cloudTokenStart);
  }

  return trimmed;
}

export function encryptJiraConnectionToken(token: string): string {
  return encryptSecret(normalizeJiraToken(token));
}

export function hasJiraConnectionToken(connection: JiraCredentialConnection): boolean {
  return !!connection.apiTokenEncrypted;
}

export function getJiraConnectionToken(connection: JiraCredentialConnection): string {
  if (!connection.apiTokenEncrypted) return '';
  return decryptSecret(connection.apiTokenEncrypted);
}
