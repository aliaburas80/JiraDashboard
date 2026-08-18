import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { listMetricsScopeFiles, metricsScopeFileDir } from '../../../../../src/services/metrics/latestMetricsStorage';
import { readStorageSettings, listCloudBackups } from '../../../../../src/services/storage/storageProvider';
import { getCacheMeta } from '../../../../../src/services/storage/cloudSync';
import { getOwnerDeploymentDiagnostics } from '../../../../../src/server/tenancy/adminOperationalRepository';
import { requireOwnerAdmin } from '../../../../lib/adminGuard';

export async function GET() {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;

  const now = new Date();
  const diagnostics = await getOwnerDeploymentDiagnostics();

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
  if (diagnostics.unresolvedSystemErrors > 0) {
    opsScore -= Math.min(15, diagnostics.unresolvedSystemErrors);
  }
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
    users: { total: diagnostics.totalUsers, active: diagnostics.activeUsers, admins: diagnostics.adminUsers },
    sessions: { total: diagnostics.totalSessions, active: diagnostics.activeSessions },
    imports: {
      total: diagnostics.totalImports,
      successful: diagnostics.successImports,
      failed: diagnostics.failedImports,
      successRate: diagnostics.totalImports ? Math.round((diagnostics.successImports / diagnostics.totalImports) * 100) : 0,
      avgHealthScore: Math.round(diagnostics.avgHealthScore * 10) / 10,
      avgProcessingMs: Math.round(diagnostics.avgProcessingMs),
    },
    snapshots: { total: diagnostics.totalSnapshots },
    auditEvents: { total: diagnostics.totalAuditEvents },
    systemErrors: {
      unresolved: diagnostics.unresolvedSystemErrors,
      latestAt: diagnostics.latestError?.createdAt?.toISOString() ?? null,
      latestCode: diagnostics.latestError?.errorCode ?? null,
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
