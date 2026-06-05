// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET  /api/admin/storage — return current storage settings + provider info
// POST /api/admin/storage — update active provider and credentials
// POST /api/admin/storage?action=test — test current provider connectivity
// POST /api/admin/storage?action=upload — upload latest backup to cloud

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import {
  readStorageSettings,
  writeStorageSettings,
  createProvider,
  listCloudBackups,
  PROVIDER_INFO,
} from '@/services/storage/storageProvider';
import { createBackup } from '@/services/settings/backup.service';
import type { StorageSettings } from '@/types/storage';

async function requireAdmin(): Promise<{ session: SessionData } | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn)      return NextResponse.json({ error: 'Not authenticated.' },     { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return { session };
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
    s3:     { bucket: settings.s3.bucket, region: settings.s3.region, prefix: settings.s3.prefix, endpoint: settings.s3.endpoint, hasCredentials: !!(settings.s3.accessKeyId && settings.s3.secretAccessKey) },
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
    try {
      const provider = await createProvider(settings.active, settings);
      const result   = await provider.test();
      return NextResponse.json(result);  // already includes cause+fix when ok:false
    } catch (e: unknown) {
      const { explainStorageError } = await import('@/services/storage/storageErrors');
      const { raw, cause, fix } = explainStorageError(e);
      return NextResponse.json({ ok: false, error: raw, cause, fix });
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
      return NextResponse.json({ ok: true, key: remoteKey, provider: settings.active });
    } catch (e: unknown) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
  }

  // ── Update settings ──────────────────────────────────────────────────────
  let body: Partial<StorageSettings>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const current = readStorageSettings();
  const updated: StorageSettings = {
    ...current,
    ...body,
    updatedAt: new Date().toISOString(),
    updatedBy: session.email,
  };
  writeStorageSettings(updated);
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
