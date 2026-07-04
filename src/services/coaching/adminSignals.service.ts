// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Admin operational signals for RBC-09 — server-only, read-only. Reuses
// existing storage/system-error infrastructure rather than building new
// plumbing: unresolved SystemErrorLog count, active storage provider, and
// cloud-sync freshness (via getCacheMeta(), which performs no network I/O —
// not syncFromCloud(), which would actually trigger a sync).

import { prisma } from '@/lib/prisma';
import { readStorageSettings } from '@/services/storage/storageProvider';
import { getCacheMeta } from '@/services/storage/cloudSync';

export interface AdminCoachingSignals {
  unresolvedErrorCount: number;
  storageProvider: string;
  cloudSyncOk: boolean;
  cloudSyncFetchedAt: string | null;
}

// A cloud cache fetched more than this many hours ago is treated as stale for coaching purposes.
const STALE_CLOUD_SYNC_HOURS = 24;

export async function getAdminCoachingSignals(): Promise<AdminCoachingSignals> {
  const unresolvedErrorCount = await prisma.systemErrorLog.count({ where: { resolvedAt: null } });
  const storageSettings = readStorageSettings();
  const cacheMeta = getCacheMeta();

  const cloudSyncOk = storageSettings.active === 'local'
    ? true
    : cacheMeta !== null
      && (Date.now() - new Date(cacheMeta.fetchedAt).getTime()) < STALE_CLOUD_SYNC_HOURS * 3600_000;

  return {
    unresolvedErrorCount,
    storageProvider: storageSettings.active,
    cloudSyncOk,
    cloudSyncFetchedAt: cacheMeta?.fetchedAt ?? null,
  };
}
