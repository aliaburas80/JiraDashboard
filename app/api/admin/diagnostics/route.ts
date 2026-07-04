// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/diagnostics — system health snapshot (admin only)

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { readLatestMetrics } from '@/services/metrics/latestMetricsStorage';
import { readStorageSettings, listCloudBackups } from '@/services/storage/storageProvider';
import { getCacheMeta } from '@/services/storage/cloudSync';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn)      return NextResponse.json({ error: 'Not authenticated.' },       { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' },   { status: 403 });

  const now = new Date();

  const [
    totalUsers,
    activeUsers,
    adminUsers,
    lastLogin,
    totalSessions,
    activeSessions,
    totalImports,
    successImports,
    failedImports,
    avgHealthScore,
    avgProcessingMs,
    lastImport,
    totalSnapshots,
    totalAuditEvents,
    recentEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.user.findFirst({ orderBy: { lastLoginAt: 'desc' }, select: { lastLoginAt: true, email: true } }),
    prisma.session.count(),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.importLog.count(),
    prisma.importLog.count({ where: { status: 'success' } }),
    prisma.importLog.count({ where: { status: { in: ['failed', 'validation_failed'] } } }),
    prisma.importLog.aggregate({ _avg: { healthScore: true }, where: { status: 'success' } }),
    prisma.importLog.aggregate({ _avg: { processingTimeMs: true }, where: { status: 'success' } }),
    prisma.importLog.findFirst({ orderBy: { uploadedAt: 'desc' }, select: { uploadedAt: true, fileName: true, healthScore: true, status: true } }),
    prisma.dashboardSnapshot.count(),
    prisma.auditEvent.count(),
    prisma.auditEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, eventType: true, eventDescription: true, createdAt: true, ipAddress: true, userId: true },
    }),
  ]);

  // Environment checks (presence only — never expose values)
  const envChecks = {
    sessionSecretSet:  (process.env.SESSION_SECRET ?? '').length >= 32,
    nodeEnvProduction: process.env.NODE_ENV === 'production',
    dbUrlSet:          !!process.env.DATABASE_URL,
    registrationLocked: process.env.ALLOW_OPEN_REGISTRATION !== 'true',
    publicUrlSet:      !!process.env.NEXT_PUBLIC_APP_URL,
  };

  const successRate = totalImports > 0
    ? Math.round((successImports / totalImports) * 100)
    : 0;

  // Simple ops health score (separate from security score)
  let opsScore = 100;
  if (!envChecks.sessionSecretSet)    opsScore -= 30;
  if (!envChecks.nodeEnvProduction)   opsScore -= 10;
  if (!envChecks.registrationLocked)  opsScore -= 10;
  if (failedImports > 0)              opsScore -= Math.min(10, failedImports);
  if (activeSessions === 0 && totalUsers > 0) opsScore -= 5;
  opsScore = Math.max(0, opsScore);

  // ── Latest metrics + cloud copy freshness (STORAGE-DEC-10) ─────────────────
  const latest = readLatestMetrics();
  const latestAgeMinutes = latest?.savedAt
    ? Math.round((now.getTime() - new Date(latest.savedAt).getTime()) / 60_000)
    : null;

  const storageSettings = readStorageSettings();
  let cloudBackupCount = 0;
  let latestCloudBackupAt: string | null = null;
  let latestCloudBackupKey: string | null = null;
  let cloudListError: string | null = null;

  if (storageSettings.active !== 'local') {
    try {
      const backups = await listCloudBackups();
      cloudBackupCount = backups.length;
      if (backups.length > 0) {
        const sorted = [...backups].sort((a, b) =>
          (b.lastModified ?? '').localeCompare(a.lastModified ?? ''));
        latestCloudBackupAt  = sorted[0].lastModified ?? null;
        latestCloudBackupKey = sorted[0].key ?? null;
      }
    } catch (e: unknown) {
      cloudListError = e instanceof Error ? e.message : String(e);
    }
  }

  const cacheMeta = getCacheMeta();

  const metricsSync = {
    available:    !!latest,
    savedAt:       latest?.savedAt ?? null,
    ageMinutes:    latestAgeMinutes,
    source:        latest?.origin?.source ?? null,
    connectionName: latest?.origin?.connectionName ?? null,
    cloudProvider: storageSettings.active,
    cloudBackupCount,
    latestCloudBackupAt,
    latestCloudBackupKey,
    cloudListError,
    lastFetchedAt: cacheMeta?.fetchedAt ?? null,
    lastPushedAt:  cacheMeta?.pushedAt ?? null,
    pendingPush:   cacheMeta?.pendingPush ?? false,
  };

  return NextResponse.json({
    generatedAt: now.toISOString(),
    opsScore,
    users: {
      total:       totalUsers,
      active:      activeUsers,
      admins:      adminUsers,
      lastLoginAt: lastLogin?.lastLoginAt ?? null,
      lastLoginBy: lastLogin?.email ?? null,
    },
    sessions: {
      total:  totalSessions,
      active: activeSessions,
    },
    imports: {
      total:           totalImports,
      successful:      successImports,
      failed:          failedImports,
      successRate,
      avgHealthScore:  Math.round((avgHealthScore._avg.healthScore ?? 0) * 10) / 10,
      avgProcessingMs: Math.round(avgProcessingMs._avg.processingTimeMs ?? 0),
      lastAt:          lastImport?.uploadedAt ?? null,
      lastFileName:    lastImport?.fileName   ?? null,
      lastHealthScore: lastImport?.healthScore ?? null,
      lastStatus:      lastImport?.status     ?? null,
    },
    snapshots: {
      total: totalSnapshots,
    },
    metricsSync,
    auditEvents: {
      total:  totalAuditEvents,
      recent: recentEvents.map(e => ({
        id:          e.id,
        type:        e.eventType,
        description: e.eventDescription,
        at:          e.createdAt.toISOString(),
        ip:          e.ipAddress ?? null,
      })),
    },
    env: envChecks,
    system: {
      nodeVersion:  process.version,
      platform:     process.platform,
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
}

export const dynamic = 'force-dynamic';
