import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../../../../src/lib/prisma';
import { listMetricsScopeFiles, metricsScopeFileDir } from '../../../../../src/services/metrics/latestMetricsStorage';
import { readStorageSettings, listCloudBackups } from '../../../../../src/services/storage/storageProvider';
import { getCacheMeta } from '../../../../../src/services/storage/cloudSync';
import { requireOwnerAdmin } from '../../../../lib/adminGuard';

export async function GET() {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;

  const now = new Date();
  const [
    totalUsers,
    activeUsers,
    adminUsers,
    totalSessions,
    activeSessions,
    totalImports,
    successImports,
    failedImports,
    avgHealthScore,
    avgProcessingMs,
    totalSnapshots,
    totalAuditEvents,
    unresolvedSystemErrors,
    latestError,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.session.count(),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.importLog.count(),
    prisma.importLog.count({ where: { status: 'success' } }),
    prisma.importLog.count({ where: { status: { in: ['failed', 'validation_failed'] } } }),
    prisma.importLog.aggregate({ _avg: { healthScore: true }, where: { status: 'success' } }),
    prisma.importLog.aggregate({ _avg: { processingTimeMs: true }, where: { status: 'success' } }),
    prisma.dashboardSnapshot.count(),
    prisma.auditEvent.count(),
    prisma.systemErrorLog.count({ where: { resolvedAt: null } }),
    prisma.systemErrorLog.findFirst({ orderBy: { createdAt: 'desc' } }),
  ]);

  const env = {
    adminSessionSecretSet: (process.env.ADMIN_SESSION_SECRET ?? '').length >= 32,
    configEncryptionKeySet: (process.env.CONFIG_ENCRYPTION_KEY ?? '').length >= 32,
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
    adminAppUrlSet: Boolean(process.env.ADMIN_APP_URL),
    nodeEnvProduction: process.env.NODE_ENV === 'production',
  };

  let opsScore = 100;
  if (!env.adminSessionSecretSet) opsScore -= 30;
  if (!env.configEncryptionKeySet) opsScore -= 20;
  if (!env.databaseUrlSet) opsScore -= 30;
  if (!env.adminAppUrlSet) opsScore -= 10;
  if (!env.nodeEnvProduction) opsScore -= 5;
  if (unresolvedSystemErrors > 0) opsScore -= Math.min(15, unresolvedSystemErrors);
  opsScore = Math.max(0, opsScore);

  const scopeFiles = listMetricsScopeFiles();
  let mostRecentWriteMs: number | null = null;
  for (const file of scopeFiles) {
    try {
      const mtimeMs = fs.statSync(path.join(metricsScopeFileDir(), file)).mtimeMs;
      if (mostRecentWriteMs === null || mtimeMs > mostRecentWriteMs) mostRecentWriteMs = mtimeMs;
    } catch { /* best-effort ops signal */ }
  }

  const storageSettings = readStorageSettings();
  let cloudBackupCount = 0;
  let latestCloudBackupAt: string | null = null;
  let cloudListError: string | null = null;
  if (storageSettings.active !== 'local') {
    try {
      const backups = await listCloudBackups();
      cloudBackupCount = backups.length;
      const latest = [...backups].sort((a, b) => (b.lastModified ?? '').localeCompare(a.lastModified ?? ''))[0];
      latestCloudBackupAt = latest?.lastModified ?? null;
    } catch (error) {
      cloudListError = error instanceof Error ? error.message : String(error);
    }
  }

  const cacheMeta = getCacheMeta();
  return NextResponse.json({
    generatedAt: now.toISOString(),
    opsScore,
    users: { total: totalUsers, active: activeUsers, admins: adminUsers },
    sessions: { total: totalSessions, active: activeSessions },
    imports: {
      total: totalImports,
      successful: successImports,
      failed: failedImports,
      successRate: totalImports ? Math.round((successImports / totalImports) * 100) : 0,
      avgHealthScore: Math.round((avgHealthScore._avg.healthScore ?? 0) * 10) / 10,
      avgProcessingMs: Math.round(avgProcessingMs._avg.processingTimeMs ?? 0),
    },
    snapshots: { total: totalSnapshots },
    auditEvents: { total: totalAuditEvents },
    systemErrors: {
      unresolved: unresolvedSystemErrors,
      latestAt: latestError?.createdAt?.toISOString() ?? null,
      latestCode: latestError?.errorCode ?? null,
    },
    metricsSync: {
      available: scopeFiles.length > 0,
      scopedFileCount: scopeFiles.length,
      mostRecentWriteAt: mostRecentWriteMs === null ? null : new Date(mostRecentWriteMs).toISOString(),
      cloudProvider: storageSettings.active,
      cloudBackupCount,
      latestCloudBackupAt,
      cloudListError,
      lastFetchedAt: cacheMeta?.fetchedAt ?? null,
      lastPushedAt: cacheMeta?.pushedAt ?? null,
      pendingPush: cacheMeta?.pendingPush ?? false,
    },
    env,
    system: { nodeVersion: process.version, platform: process.platform, uptimeSeconds: Math.round(process.uptime()) },
  });
}

export const dynamic = 'force-dynamic';
