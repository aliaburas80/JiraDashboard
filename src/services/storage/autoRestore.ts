// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Auto-restore local config/diagnostics files from cloud on startup.
// Called once by instrumentation.ts when the Next.js server starts.
// If the database has no users yet, finds the latest cloud backup (of the
// local JSON config files — see src/services/settings/backup.service.ts,
// this does not restore the database itself) and restores it automatically.

export interface AutoRestoreResult {
  action:   'skipped' | 'no-provider' | 'no-backups' | 'restored' | 'failed';
  reason:   string;
  key?:     string;
  restored?: string[];
  error?:   string;
}

export async function autoRestoreFromCloud(): Promise<AutoRestoreResult> {
  // 1. Check if the database already has data
  try {
    const { prisma } = await import('@/lib/prisma');
    const count = await prisma.user.count();
    if (count > 0) {
      return { action: 'skipped', reason: `Database already has ${count} user(s). No restore needed.` };
    }
  } catch {
    // Can't connect — try restore anyway
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
