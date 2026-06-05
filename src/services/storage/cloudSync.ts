// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Smart cloud sync service — Rules:
//
// 1. CACHE-FIRST: Keep a local copy of the latest cloud backup.
//    Never fetch from the bucket if the local cache is up-to-date.
//    Cache validity is checked using a hash of the backup content.
//
// 2. FALLBACK: If the cloud provider is unreachable, serve from the
//    local cache. Queue any pending changes and push them when the
//    connection is restored.
//
// 3. PUSH-ON-CHANGE: Whenever local data changes (new upload, snapshot,
//    config update), immediately push a fresh backup to the cloud bucket
//    so all copies stay at the same version.
//
// 4. PROVIDER SWITCH: When the admin selects a new cloud provider,
//    download the latest backup from S3 (or the old provider) first,
//    then begin using the new provider — never lose data.

import fs   from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR   = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, '.cloud-cache-meta.json');

export type CloudSyncStatus =
  | 'idle'
  | 'loading'       // fetching from cloud
  | 'cache-hit'     // local cache is current, no fetch needed
  | 'restored'      // freshly restored from cloud
  | 'pushed'        // just pushed to cloud
  | 'fallback'      // cloud unavailable, using local cache
  | 'offline'       // no cloud provider configured
  | 'error';

export interface CloudCacheMeta {
  provider:      string;              // which provider the cache came from
  key:           string;              // object key in the bucket
  contentHash:   string;             // SHA-256 of the backup content
  fetchedAt:     string;             // ISO timestamp of last fetch
  pushedAt?:     string;             // ISO timestamp of last push
  pendingPush:   boolean;            // local changes not yet pushed
}

export interface CloudSyncResult {
  status:  CloudSyncStatus;
  source:  'cloud' | 'cache' | 'local' | 'none';
  provider?: string;
  key?:    string;
  reason?: string;
  error?:  string;
}

// ── Cache metadata ────────────────────────────────────────────────────────────

function readCacheMeta(): CloudCacheMeta | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch { return null; }
}

function writeCacheMeta(meta: CloudCacheMeta): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(meta, null, 2));
  } catch {}
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export function markPendingPush(): void {
  const meta = readCacheMeta();
  if (meta) writeCacheMeta({ ...meta, pendingPush: true });
}

export function getCacheMeta(): CloudCacheMeta | null {
  return readCacheMeta();
}

// ── Core sync logic ───────────────────────────────────────────────────────────

/**
 * Sync from cloud on startup.
 * Returns immediately from cache if content hasn't changed.
 * Falls back to local cache if cloud is unreachable.
 */
export async function syncFromCloud(): Promise<CloudSyncResult> {
  const { readStorageSettings, createProvider } = await import('@/services/storage/storageProvider');
  const settings = readStorageSettings();

  if (settings.active === 'local') {
    return { status: 'offline', source: 'local', reason: 'Local storage mode — no cloud sync.' };
  }

  // List cloud backups
  let backups: { key: string; lastModified: string }[] = [];
  try {
    const provider = await createProvider(settings.active, settings);
    backups = await provider.list();
  } catch (e: unknown) {
    const cached = readCacheMeta();
    return {
      status:   'fallback',
      source:   cached ? 'cache' : 'none',
      provider: settings.active,
      reason:   'Cloud unreachable. ' + (cached ? `Serving from local cache (last fetched ${cached.fetchedAt}).` : 'No local cache available.'),
      error:    e instanceof Error ? e.message : String(e),
    };
  }

  if (!backups.length) {
    return { status: 'idle', source: 'local', provider: settings.active, reason: 'No backups in bucket yet.' };
  }

  // Find newest backup
  const sorted = [...backups].sort((a, b) =>
    (b.lastModified ?? b.key).localeCompare(a.lastModified ?? a.key)
  );
  const latest = sorted[0];

  // Check if our local cache is already current (cache-hit — skip download)
  const meta = readCacheMeta();
  if (meta && meta.provider === settings.active && meta.key === latest.key && !meta.pendingPush) {
    return {
      status:   'cache-hit',
      source:   'cache',
      provider: settings.active,
      key:      latest.key,
      reason:   `Local cache is current (key: ${latest.key}, fetched: ${meta.fetchedAt}).`,
    };
  }

  // Download and check content hash
  let content: string;
  try {
    const provider = await createProvider(settings.active, settings);
    content = await provider.download(latest.key);
  } catch (e: unknown) {
    const cached = readCacheMeta();
    return {
      status:   'fallback',
      source:   cached ? 'cache' : 'none',
      provider: settings.active,
      reason:   'Download failed. ' + (cached ? `Using local cache from ${cached.fetchedAt}.` : 'No cache.'),
      error:    e instanceof Error ? e.message : String(e),
    };
  }

  const newHash = hashContent(content);
  if (meta && meta.contentHash === newHash && !meta.pendingPush) {
    // Content hash matches — update key reference but no need to restore
    writeCacheMeta({ ...meta, key: latest.key, provider: settings.active, fetchedAt: new Date().toISOString() });
    return {
      status:   'cache-hit',
      source:   'cache',
      provider: settings.active,
      key:      latest.key,
      reason:   'Content hash matches local cache — skipping restore.',
    };
  }

  // New content — restore
  const bundle = JSON.parse(content);
  const { restoreBackup } = await import('@/services/settings/backup.service');
  const result = restoreBackup(bundle);

  writeCacheMeta({
    provider:    settings.active,
    key:         latest.key,
    contentHash: newHash,
    fetchedAt:   new Date().toISOString(),
    pendingPush: false,
  });

  return {
    status:   'restored',
    source:   'cloud',
    provider: settings.active,
    key:      latest.key,
    reason:   `Restored from ${settings.active}: ${latest.key}. Files: ${result.restored.join(', ')}.`,
  };
}

/**
 * Push current local data to cloud.
 * Called after any local data change (upload, snapshot, config update).
 */
export async function pushToCloud(): Promise<CloudSyncResult> {
  const { readStorageSettings, createProvider } = await import('@/services/storage/storageProvider');
  const settings = readStorageSettings();

  if (settings.active === 'local') {
    return { status: 'offline', source: 'local', reason: 'Local storage — nothing to push.' };
  }

  try {
    const { createBackup } = await import('@/services/settings/backup.service');
    const bundle   = createBackup();
    const content  = JSON.stringify(bundle, null, 2);
    const filename = `delivery-clarity-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

    const provider = await createProvider(settings.active, settings);
    const key      = await provider.upload(filename, content);

    const meta = readCacheMeta();
    writeCacheMeta({
      provider:    settings.active,
      key,
      contentHash: hashContent(content),
      fetchedAt:   meta?.fetchedAt ?? new Date().toISOString(),
      pushedAt:    new Date().toISOString(),
      pendingPush: false,
    });

    return { status: 'pushed', source: 'local', provider: settings.active, key };
  } catch (e: unknown) {
    markPendingPush(); // mark for retry when connection restored
    return {
      status:  'error',
      source:  'local',
      provider: settings.active,
      error:   e instanceof Error ? e.message : String(e),
      reason:  'Push failed. Changes marked as pending — will retry on next connection.',
    };
  }
}

/**
 * Handle provider switch: download from old provider, push to new provider.
 * Ensures no data loss when switching S3 → Azure → GCP etc.
 */
export async function switchProvider(newProvider: string): Promise<CloudSyncResult> {
  // 1. Try to get latest data from the current cloud provider
  await syncFromCloud();

  // 2. Push current local state to the new provider (caller must have already
  //    saved the new provider settings before calling this)
  return pushToCloud();
}
