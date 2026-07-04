// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Auto-restore from cloud on startup.
// Called once by instrumentation.ts when the Next.js server starts.
// If the local database is missing or has no users, finds the latest
// cloud backup and restores it automatically.

import fs   from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'delivery_clarity.db');

export interface AutoRestoreResult {
  action:   'skipped' | 'no-provider' | 'no-backups' | 'restored' | 'failed';
  reason:   string;
  key?:     string;
  restored?: string[];
  error?:   string;
}

export async function autoRestoreFromCloud(): Promise<AutoRestoreResult> {
  // 1. Check if local DB already exists with data
  if (fs.existsSync(DB_PATH)) {
    try {
      const { prisma } = await import('@/lib/prisma');
      const count = await prisma.user.count();
      if (count > 0) {
        return { action: 'skipped', reason: `Local database exists with ${count} user(s). No restore needed.` };
      }
    } catch {
      // DB exists but can't connect — try restore anyway
    }
  }

  // 2. Check if a cloud provider is configured
  const { readStorageSettings, createProvider } = await import('@/services/storage/storageProvider');
  const settings = readStorageSettings();

  if (settings.active === 'local') {
    return { action: 'no-provider', reason: 'No cloud provider configured. Set one in Admin Settings → Cloud Storage.' };
  }

  // 3. List backups from cloud provider
  let backups: { key: string; lastModified: string }[] = [];
  try {
    const provider = await createProvider(settings.active, settings);
    backups = await provider.list();
  } catch (e: unknown) {
    return { action: 'failed', reason: 'Could not connect to cloud storage to list backups.', error: e instanceof Error ? e.message : String(e) };
  }

  if (backups.length === 0) {
    return { action: 'no-backups', reason: `No backups found in ${settings.active} bucket.` };
  }

  // 4. Pick the newest backup (by lastModified, then by key name)
  const sorted = [...backups].sort((a, b) => {
    if (a.lastModified && b.lastModified) return b.lastModified.localeCompare(a.lastModified);
    return b.key.localeCompare(a.key);
  });
  const latest = sorted[0];

  // 5. Download and restore
  try {
    const provider = await createProvider(settings.active, settings);
    const content  = await provider.download(latest.key);
    const bundle   = JSON.parse(content);

    const { restoreBackup } = await import('@/services/settings/backup.service');
    const result = restoreBackup(bundle);

    console.log(`[AutoRestore] Restored from cloud (${settings.active}): ${latest.key}`);
    console.log(`[AutoRestore] Restored files: ${result.restored.join(', ')}`);

    return {
      action:   'restored',
      reason:   `Restored from ${settings.active} backup: ${latest.key}`,
      key:      latest.key,
      restored: result.restored,
    };
  } catch (e: unknown) {
    return {
      action: 'failed',
      reason: `Download or restore failed for key: ${latest.key}`,
      key:    latest.key,
      error:  e instanceof Error ? e.message : String(e),
    };
  }
}
