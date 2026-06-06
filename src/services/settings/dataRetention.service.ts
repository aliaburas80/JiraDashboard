// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Data retention enforcement — deletes logs/snapshots older than the configured
// retention period. Also provides per-user and admin delete operations.

import { prisma } from '@/lib/prisma';
import type { RetentionSettings, RetentionStats } from '@/types/settings';

// ── Cutoff date ───────────────────────────────────────────────────────────────

function cutoffDate(retentionDays: number): Date | null {
  if (retentionDays === -1) return null; // keep forever
  const d = new Date();
  d.setDate(d.getDate() - retentionDays);
  return d;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getRetentionStats(settings: RetentionSettings): Promise<RetentionStats> {
  const cutoff = cutoffDate(settings.retentionDays);

  const [totalLogs, totalSnaps, eligibleLogs, eligibleSnaps, oldest, newest] = await Promise.all([
    prisma.importLog.count(),
    prisma.dashboardSnapshot.count(),
    cutoff ? prisma.importLog.count({ where: { uploadedAt: { lt: cutoff } } }) : Promise.resolve(0),
    cutoff ? prisma.dashboardSnapshot.count({ where: { createdAt: { lt: cutoff } } }) : Promise.resolve(0),
    prisma.importLog.findFirst({ orderBy: { uploadedAt: 'asc' },  select: { uploadedAt: true } }),
    prisma.importLog.findFirst({ orderBy: { uploadedAt: 'desc' }, select: { uploadedAt: true } }),
  ]);

  return {
    totalLogs,
    logsEligible:      eligibleLogs,
    totalSnapshots:    totalSnaps,
    snapshotsEligible: eligibleSnaps,
    oldestLogDate:     oldest?.uploadedAt?.toISOString() ?? null,
    newestLogDate:     newest?.uploadedAt?.toISOString() ?? null,
  };
}

// ── Apply retention policy ────────────────────────────────────────────────────

export async function applyRetentionPolicy(
  settings: RetentionSettings,
  actorId: string,
): Promise<{ logsDeleted: number; snapshotsDeleted: number }> {
  const cutoff = cutoffDate(settings.retentionDays);
  if (!cutoff) return { logsDeleted: 0, snapshotsDeleted: 0 };

  let logsDeleted = 0;
  let snapshotsDeleted = 0;

  if (settings.autoDeleteOldLogs) {
    const res = await prisma.importLog.deleteMany({ where: { uploadedAt: { lt: cutoff } } });
    logsDeleted = res.count;
  }

  if (settings.autoDeleteOldSnapshots) {
    const res = await prisma.dashboardSnapshot.deleteMany({ where: { createdAt: { lt: cutoff } } });
    snapshotsDeleted = res.count;
  }

  if (logsDeleted > 0 || snapshotsDeleted > 0) {
    await prisma.auditEvent.create({ data: {
      userId:           actorId,
      eventType:        'retention_cleanup',
      eventDescription: `Retention policy applied: ${logsDeleted} logs and ${snapshotsDeleted} snapshots deleted (older than ${settings.retentionDays} days).`,
    }}).catch(() => {});
  }

  return { logsDeleted, snapshotsDeleted };
}

// ── Delete specific import log ────────────────────────────────────────────────

export async function deleteImportLog(
  id: string,
  requesterId: string,
  isAdmin: boolean,
): Promise<{ success: boolean; error?: string }> {
  const log = await prisma.importLog.findUnique({ where: { id } });
  if (!log) return { success: false, error: 'Import log not found.' };
  if (!isAdmin && log.userId !== requesterId) {
    return { success: false, error: 'You can only delete your own import logs.' };
  }

  await prisma.importLog.delete({ where: { id } });
  await prisma.auditEvent.create({ data: {
    userId:           requesterId,
    eventType:        'delete_import_log',
    eventDescription: `Import log ${id} (${log.fileName}) deleted.`,
  }}).catch(() => {});

  return { success: true };
}

// ── Delete all logs for a user ────────────────────────────────────────────────

export async function deleteAllUserLogs(
  userId: string,
  requesterId: string,
  isAdmin: boolean,
): Promise<{ success: boolean; deleted: number; error?: string }> {
  if (!isAdmin && userId !== requesterId) {
    return { success: false, deleted: 0, error: 'You can only delete your own logs.' };
  }

  const res = await prisma.importLog.deleteMany({ where: { userId } });

  await prisma.auditEvent.create({ data: {
    userId:           requesterId,
    eventType:        'delete_all_logs',
    eventDescription: `All ${res.count} import logs for user ${userId} deleted.`,
  }}).catch(() => {});

  return { success: true, deleted: res.count };
}

// ── Clear ALL data (admin only) ───────────────────────────────────────────────

export async function clearAllData(
  actorId: string,
): Promise<{ logsDeleted: number; snapshotsDeleted: number }> {
  const [logs, snaps] = await Promise.all([
    prisma.importLog.deleteMany({}),
    prisma.dashboardSnapshot.deleteMany({}),
  ]);

  await prisma.auditEvent.create({ data: {
    userId:           actorId,
    eventType:        'clear_all_data',
    eventDescription: `Admin cleared all data: ${logs.count} logs and ${snaps.count} snapshots deleted.`,
  }}).catch(() => {});

  return { logsDeleted: logs.count, snapshotsDeleted: snaps.count };
}

// ── Delete specific dashboard snapshot ───────────────────────────────────────

export async function deleteDashboardSnapshot(
  id: string,
  requesterId: string,
  isAdmin: boolean,
): Promise<{ success: boolean; error?: string }> {
  const snap = await prisma.dashboardSnapshot.findUnique({ where: { id } });
  if (!snap) return { success: false, error: 'Snapshot not found.' };
  if (!isAdmin && snap.userId !== requesterId) {
    return { success: false, error: 'You can only delete your own snapshots.' };
  }

  await prisma.dashboardSnapshot.delete({ where: { id } });
  await prisma.auditEvent.create({ data: {
    userId:           requesterId,
    eventType:        'delete_snapshot',
    eventDescription: `Dashboard snapshot ${id} (${snap.snapshotName}) deleted.`,
  }}).catch(() => {});

  return { success: true };
}
