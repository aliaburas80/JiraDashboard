// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// CRUD for encrypted per-deployment SMTP settings stored in the database.
// The password is encrypted with AES-256-GCM via secret-field.ts before
// storage and decrypted only at send time — plaintext never persists.

import { prisma } from '@/lib/prisma';
import { encryptSecret, decryptSecret } from '@/lib/secret-field';
import type { AppSmtpConfig } from '@/lib/app-config';

export interface SmtpSettingsRow {
  id:          string;
  host:        string;
  port:        number;
  username:    string;
  fromAddress: string;
  hasPass:     boolean;
  updatedAt:   Date;
}

/** Return the latest row without exposing the encrypted password. */
export async function getSmtpSettingsRow(): Promise<SmtpSettingsRow | null> {
  const row = await prisma.smtpSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (!row) return null;
  return {
    id:          row.id,
    host:        row.host,
    port:        row.port,
    username:    row.username,
    fromAddress: row.fromAddress,
    hasPass:     !!row.passEncrypted,
    updatedAt:   row.updatedAt,
  };
}

/** Return decrypted SMTP config for use in email sending. Returns null when no DB config exists. */
export async function getSmtpConfig(): Promise<AppSmtpConfig | null> {
  const row = await prisma.smtpSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (!row || !row.host || !row.username || !row.passEncrypted) return null;
  try {
    return {
      host: row.host,
      port: row.port,
      user: row.username,
      pass: decryptSecret(row.passEncrypted),
      from: row.fromAddress,
    };
  } catch {
    // Decryption fails when CONFIG_ENCRYPTION_KEY was rotated since the row was saved.
    // Return null so the caller falls back to the next source (cloud config or env vars).
    return null;
  }
}

export interface SaveSmtpInput {
  host:        string;
  port:        number;
  username:    string;
  /** Leave undefined to keep the existing stored password unchanged. */
  pass?:       string;
  fromAddress: string;
  updatedByUserId?: string;
}

/**
 * Upsert SMTP settings. Always updates the single shared row (delete + create)
 * so there is never more than one active config. If `pass` is omitted, the
 * existing encrypted password is carried over from the current row.
 */
export async function saveSmtpSettings(input: SaveSmtpInput): Promise<SmtpSettingsRow> {
  const existing = await prisma.smtpSettings.findFirst({ orderBy: { updatedAt: 'desc' } });

  let passEncrypted: string;
  if (input.pass?.trim()) {
    passEncrypted = encryptSecret(input.pass.trim());
  } else if (existing?.passEncrypted) {
    passEncrypted = existing.passEncrypted;
  } else {
    throw new Error('A password is required when saving SMTP settings for the first time.');
  }

  // Replace existing row to keep exactly one canonical config.
  await prisma.smtpSettings.deleteMany();
  const row = await prisma.smtpSettings.create({
    data: {
      host:            input.host.trim(),
      port:            input.port,
      username:        input.username.trim(),
      passEncrypted,
      fromAddress:     input.fromAddress.trim(),
      updatedByUserId: input.updatedByUserId ?? null,
    },
  });

  return {
    id:          row.id,
    host:        row.host,
    port:        row.port,
    username:    row.username,
    fromAddress: row.fromAddress,
    hasPass:     true,
    updatedAt:   row.updatedAt,
  };
}

/** Remove all stored SMTP settings from the database. */
export async function deleteSmtpSettings(): Promise<void> {
  await prisma.smtpSettings.deleteMany();
}
