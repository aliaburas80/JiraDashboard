// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Per-connection Jira credential handling. Tokens are stored encrypted on the
// JiraConnection row so each connection can authenticate as a different account.

import type { JiraConnection } from '@prisma/client';
import { decryptSecret, encryptSecret } from '@/lib/secret-field';

type JiraCredentialConnection = Pick<JiraConnection, 'apiTokenEncrypted'>;

export type JiraConnectionTokenResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export const JIRA_CONNECTION_TOKEN_MISSING_ERROR =
  'No Jira API token is configured for this connection. Delete and recreate the connection with its API token / PAT.';

export const JIRA_CONNECTION_TOKEN_DECRYPT_ERROR =
  'The Jira API token saved for this connection cannot be decrypted. Delete and recreate the connection with the current server encryption key.';

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

export function resolveJiraConnectionToken(
  connection: JiraCredentialConnection,
): JiraConnectionTokenResult {
  if (!connection.apiTokenEncrypted) {
    return { ok: false, error: JIRA_CONNECTION_TOKEN_MISSING_ERROR };
  }

  try {
    const token = decryptSecret(connection.apiTokenEncrypted);
    return token
      ? { ok: true, token }
      : { ok: false, error: JIRA_CONNECTION_TOKEN_MISSING_ERROR };
  } catch {
    return { ok: false, error: JIRA_CONNECTION_TOKEN_DECRYPT_ERROR };
  }
}
