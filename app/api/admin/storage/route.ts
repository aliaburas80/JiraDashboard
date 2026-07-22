// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/storage — return current storage settings + provider info
// POST /api/admin/storage — update active provider and credentials
// POST /api/admin/storage?action=test — test current provider connectivity
// POST /api/admin/storage?action=upload — upload latest backup to cloud

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import {
  readStorageSettings,
  writeStorageSettings,
  createProvider,
  listCloudBackups,
  PROVIDER_INFO,
} from '@/services/storage/storageProvider';
import { createBackup } from '@/services/settings/backup.service';
import { safeAuditEvent } from '@/lib/system-error-logger';
import type { StorageSettings } from '@/types/storage';

type StorageSettingsUpdate = Partial<StorageSettings> & {
  s3?: Partial<StorageSettings['s3']> & { hasCredentials?: boolean };
  azure?: Partial<StorageSettings['azure']> & { hasCredentials?: boolean };
  gcp?: Partial<StorageSettings['gcp']> & { hasCredentials?: boolean };
};

async function requireAdmin(): Promise<{ session: SessionData } | NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn)      return NextResponse.json({ error: 'Not authenticated.' },     { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return { session };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function stripPresenceFlag<T extends { hasCredentials?: boolean }>(config: T | undefined): Omit<T, 'hasCredentials'> | undefined {
  if (!config) return undefined;
  const { hasCredentials, ...rest } = config;
  return rest;
}

function preserveSecret(currentValue: string | undefined, nextValue: unknown): string | undefined {
  if (nonEmpty(nextValue)) return nextValue;
  if (nextValue === '') return currentValue;
  return currentValue;
}

function s3CredentialSources(settings: StorageSettings) {
  return {
    hasFormCredentials:       !!(settings.s3?.accessKeyId?.trim() && settings.s3?.secretAccessKey?.trim()),
    hasEnvCredentials:        !!(process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim()),
    hasAwsProfile:            !!process.env.AWS_PROFILE?.trim(),
    hasSharedCredentialsFile: fs.existsSync(path.join(os.homedir(), '.aws', 'credentials')),
    awsRegionFromEnv:         process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION ?? null,
  };
}

function mergeStorageSettingsUpdate(current: StorageSettings, body: StorageSettingsUpdate, updatedBy: string): StorageSettings {
  const s3Input    = stripPresenceFlag(body.s3);
  const azureInput = stripPresenceFlag(body.azure);
  const gcpInput   = stripPresenceFlag(body.gcp);

  return {
    ...current,
    ...body,
    s3: s3Input ? {
      ...current.s3,
      ...s3Input,
      accessKeyId:     preserveSecret(current.s3.accessKeyId, s3Input.accessKeyId),
      secretAccessKey: preserveSecret(current.s3.secretAccessKey, s3Input.secretAccessKey),
    } : current.s3,
    azure: azureInput ? {
      ...current.azure,
      ...azureInput,
      connectionString: preserveSecret(current.azure.connectionString, azureInput.connectionString),
    } : current.azure,
    gcp: gcpInput ? {
      ...current.gcp,
      ...gcpInput,
      keyFilename: preserveSecret(current.gcp.keyFilename, gcpInput.keyFilename),
      keyJson:     preserveSecret(current.gcp.keyJson, gcpInput.keyJson),
    } : current.gcp,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
}

// ── GET — return settings + provider info + cloud backup list ──────────────

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const settings = readStorageSettings();
  let backups: unknown[] = [];

  // Try to list backups if cloud provider is active
  if (settings.active !== 'local') {
    try { backups = await listCloudBackups(); } catch { backups = []; }
  }

  // Redact secrets from response (return presence only)
  const safeSettings = {
    active: settings.active,
    s3:     { bucket: settings.s3.bucket, region: settings.s3.region, prefix: settings.s3.prefix, endpoint: settings.s3.endpoint, hasCredentials: !!(settings.s3.accessKeyId && settings.s3.secretAccessKey), credentialSources: s3CredentialSources(settings) },
    azure:  { containerName: settings.azure.containerName, prefix: settings.azure.prefix, hasCredentials: !!settings.azure.connectionString },
    gcp:    { bucket: settings.gcp.bucket, projectId: settings.gcp.projectId, prefix: settings.gcp.prefix, hasCredentials: !!(settings.gcp.keyFilename || settings.gcp.keyJson) },
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
  };

  return NextResponse.json({ settings: safeSettings, providers: PROVIDER_INFO, backups });
}

// ── POST — update settings / test / upload ────────────────────────────────

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const { session } = check as { session: SessionData };

  const action = req.nextUrl.searchParams.get('action');

  // ── Test connectivity ────────────────────────────────────────────────────
  if (action === 'test') {
    const settings = readStorageSettings();
    const fieldErr = validateServerFields(settings);
    if (fieldErr) return NextResponse.json({ ok: false, error: fieldErr });

    // Build credential source diagnostic for S3 (helps user understand what's available)
    const credDiag = settings.active === 's3' ? s3CredentialSources(settings) : null;

    try {
      const provider = await createProvider(settings.active, settings);
      const result   = await provider.test();
      return NextResponse.json({ ...result, credDiag });
    } catch (e: unknown) {
      const { explainStorageError } = await import('@/services/storage/storageErrors');
      const { raw, cause, fix } = explainStorageError(e);
      return NextResponse.json({ ok: false, error: raw, cause, fix, credDiag });
    }
  }

  // ── Server-side field validation ─────────────────────────────────────────
  function validateServerFields(s: StorageSettings): string | null {
    const { active } = s;
    // Only bucket/container names required — credentials can come from env vars
    if (active === 's3'    && !s.s3?.bucket)               return 'S3: Bucket name is required.';
    if (active === 'azure' && !s.azure?.containerName)     return 'Azure: Container name is required.';
    if (active === 'gcp'   && !s.gcp?.bucket)              return 'GCP: Bucket name is required.';
    if (active === 'gcp'   && !s.gcp?.projectId)           return 'GCP: Project ID is required.';
    return null;
  }

  // ── Upload backup to cloud ───────────────────────────────────────────────
  if (action === 'upload') {
    const settings = readStorageSettings();
    const fieldErr = validateServerFields(settings);
    if (fieldErr) return NextResponse.json({ ok: false, error: fieldErr }, { status: 400 });
    try {
      const bundle   = createBackup();
      const content  = JSON.stringify(bundle, null, 2);
      const filename = `delivery-clarity-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      const provider = await createProvider(settings.active, settings);
      const remoteKey = await provider.upload(filename, content);
      await safeAuditEvent({
        userId: session.userId,
        eventType: 'admin_storage_backup_uploaded',
        eventDescription: `${session.email} uploaded a manual backup to ${settings.active} (${remoteKey}).`,
      });
      return NextResponse.json({ ok: true, key: remoteKey, provider: settings.active });
    } catch (e: unknown) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
  }

  // ── Update settings ──────────────────────────────────────────────────────
  let body: StorageSettingsUpdate;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const current = readStorageSettings();
  const updated = mergeStorageSettingsUpdate(current, body, session.email ?? 'unknown');
  writeStorageSettings(updated);
  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_storage_settings_updated',
    eventDescription: `${session.email} updated cloud storage settings (active provider: ${updated.active}).`,
  });
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
