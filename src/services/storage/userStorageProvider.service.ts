// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-024: per-user "bring your own cloud" storage. A user in cloud storage
// mode may optionally point their uploads at a bucket they own (S3/Azure/GCP)
// instead of Delivery Clarity's own "App storage". Reuses the existing
// provider classes/factory (src/services/storage/{providers,storageProvider}.ts)
// and the existing encrypted-secret helper (src/lib/secret-field.ts) — nothing
// new needed there, only per-user persistence and a narrower config surface.
//
// A saved config is never trusted until a fresh Test Connection succeeds —
// any config change resets `verified` to false, and the upload path
// (getVerifiedUserStorageProviderInstance) only ever returns an instance when
// `verified === true`.

import { prisma } from '@/lib/prisma';
import { encryptSecret, decryptSecret } from '@/lib/secret-field';
import { createProvider } from '@/services/storage/storageProvider';
import { explainStorageError } from '@/services/storage/storageErrors';
import type { StorageProvider, StorageSettings } from '@/types/storage';

export type UserStorageProviderType = 's3' | 'azure' | 'gcp';

export interface UserStorageProviderSafe {
  provider:   UserStorageProviderType;
  config:     Record<string, string>;
  verified:   boolean;
  verifiedAt: string | null;
  lastError:  string | null;
}

export interface SaveUserStorageProviderInput {
  provider:    UserStorageProviderType;
  config:      Record<string, string>;
  credentials: Record<string, string>;
}

function validateProviderConfig(provider: UserStorageProviderType, config: Record<string, string>): string | null {
  if (provider === 's3'    && !config.bucket?.trim())        return 'Bucket name is required.';
  if (provider === 'azure' && !config.containerName?.trim()) return 'Container name is required.';
  if (provider === 'gcp'   && !config.bucket?.trim())        return 'Bucket name is required.';
  if (provider === 'gcp'   && !config.projectId?.trim())     return 'Project ID is required.';
  return null;
}

function buildSettingsShape(
  provider: UserStorageProviderType,
  config: Record<string, string>,
  credentials: Record<string, string>,
): StorageSettings {
  return {
    active: provider,
    local:  { provider: 'local' },
    s3:     provider === 's3'    ? { ...config, ...credentials } : {},
    azure:  provider === 'azure' ? { ...config, ...credentials } : {},
    gcp:    provider === 'gcp'   ? { ...config, ...credentials } : {},
  } as StorageSettings;
}

// ── Read (safe — never returns decrypted credentials) ──────────────────────────

export async function getUserStorageProviderSafe(userId: string): Promise<UserStorageProviderSafe | null> {
  const row = await prisma.userStorageProvider.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    provider:   row.provider as UserStorageProviderType,
    config:     JSON.parse(row.configJson),
    verified:   row.verified,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    lastError:  row.lastError,
  };
}

// ── Save ─────────────────────────────────────────────────────────────────────

export async function saveUserStorageProvider(
  userId: string,
  input: SaveUserStorageProviderInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validationError = validateProviderConfig(input.provider, input.config);
  if (validationError) return { ok: false, error: validationError };

  const hasNewCredentials = Object.values(input.credentials).some(v => v?.trim());
  const existing = await prisma.userStorageProvider.findUnique({ where: { userId } });

  let credentialsEnc: string | null;
  if (hasNewCredentials) {
    credentialsEnc = encryptSecret(JSON.stringify(input.credentials));
  } else if (existing && existing.provider === input.provider) {
    // Blank credential fields on an unchanged provider type = "keep what's
    // already saved" (same convention as the admin SMTP/S3 credential fields).
    credentialsEnc = existing.credentialsEnc;
  } else {
    return { ok: false, error: 'Credentials are required when configuring a new provider.' };
  }

  await prisma.userStorageProvider.upsert({
    where:  { userId },
    create: {
      userId,
      provider:   input.provider,
      configJson: JSON.stringify(input.config),
      credentialsEnc,
      verified: false,
    },
    update: {
      provider:   input.provider,
      configJson: JSON.stringify(input.config),
      credentialsEnc,
      // Any change must be re-tested — never trust a save alone.
      verified:   false,
      verifiedAt: null,
      lastError:  null,
    },
  });

  return { ok: true };
}

// ── Test connection ─────────────────────────────────────────────────────────

export interface TestUserStorageProviderResult {
  ok: boolean;
  error?: string;
  cause?: string;
  fix?: string;
}

export async function testUserStorageProvider(userId: string): Promise<TestUserStorageProviderResult> {
  const row = await prisma.userStorageProvider.findUnique({ where: { userId } });
  if (!row) return { ok: false, error: 'No storage provider configured yet.' };

  const config = JSON.parse(row.configJson) as Record<string, string>;
  const credentials = row.credentialsEnc ? (JSON.parse(decryptSecret(row.credentialsEnc)) as Record<string, string>) : {};
  const settingsShape = buildSettingsShape(row.provider as UserStorageProviderType, config, credentials);

  try {
    const provider = await createProvider(row.provider as UserStorageProviderType, settingsShape);
    const result = await provider.test();
    const isOk = result.ok === true;
    const errorMessage = isOk ? null : (result as { error: string }).error;
    const errorCause    = isOk ? undefined : (result as { cause?: string }).cause;
    const errorFix      = isOk ? undefined : (result as { fix?: string }).fix;

    await prisma.userStorageProvider.update({
      where: { userId },
      data: isOk
        ? { verified: true, verifiedAt: new Date(), lastError: null }
        : { verified: false, lastError: errorMessage },
    });

    return isOk
      ? { ok: true }
      : { ok: false, error: errorMessage as string, cause: errorCause, fix: errorFix };
  } catch (err) {
    const { raw, cause, fix } = explainStorageError(err);
    await prisma.userStorageProvider.update({
      where: { userId },
      data:  { verified: false, lastError: raw },
    });
    return { ok: false, error: raw, cause, fix };
  }
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deleteUserStorageProvider(userId: string): Promise<void> {
  await prisma.userStorageProvider.deleteMany({ where: { userId } });
}

// ── Upload-path helpers ──────────────────────────────────────────────────────

export type UserStorageProviderStatus = 'none' | 'unverified' | 'verified';

/** Used by the upload route to decide: allow (App storage), block, or push to the user's own bucket. */
export async function getUserStorageProviderStatus(userId: string): Promise<UserStorageProviderStatus> {
  const row = await prisma.userStorageProvider.findUnique({ where: { userId }, select: { verified: true } });
  if (!row) return 'none';
  return row.verified ? 'verified' : 'unverified';
}

/** Only ever returns an instance when the saved provider has been successfully tested. */
export async function getVerifiedUserStorageProviderInstance(userId: string): Promise<StorageProvider | null> {
  const row = await prisma.userStorageProvider.findUnique({ where: { userId } });
  if (!row || !row.verified) return null;

  const config = JSON.parse(row.configJson) as Record<string, string>;
  const credentials = row.credentialsEnc ? (JSON.parse(decryptSecret(row.credentialsEnc)) as Record<string, string>) : {};
  const settingsShape = buildSettingsShape(row.provider as UserStorageProviderType, config, credentials);

  return createProvider(row.provider as UserStorageProviderType, settingsShape);
}
