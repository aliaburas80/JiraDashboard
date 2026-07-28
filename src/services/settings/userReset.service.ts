// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-023: manual, admin-triggered workspace-data reset for non-internal
// (non-@deliveryclarity.app) users. Always dry-run first (previewUserReset),
// never automatic/scheduled — see product/decisions in SRS v4.27.0 for why.
// Resets a user's uploaded data (ImportLog, DashboardSnapshot, JiraConnection,
// their scoped dashboard metrics file), never the account itself
// (User/Session/Entitlement rows are untouched).

import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { metricsScopeFileDir } from '@/services/metrics/latestMetricsStorage';
import { safeAuditEvent } from '@/lib/system-error-logger';

const INTERNAL_EMAIL_DOMAIN = '@deliveryclarity.app';

function isInternalEmail(email: string): boolean {
  return email.toLowerCase().endsWith(INTERNAL_EMAIL_DOMAIN);
}

async function resolveScopedFilePath(userId: string): Promise<string> {
  const workspace = await prisma.workspace.findFirst({ where: { ownerUserId: userId, status: 'active' } });
  const scopeKey = workspace ? `ws:${workspace.id}` : `user:${userId}`;
  return path.join(metricsScopeFileDir(), `${scopeKey.replace(':', '_')}.json`);
}

export interface UserResetPreview {
  userId:               string;
  email:                string;
  importLogs:           number;
  dashboardSnapshots:   number;
  jiraConnections:      number;
  hasScopedMetricsFile: boolean;
  blocked:              boolean;
  blockedReason?:       string;
}

/** Dry-run — reports what resetUserData() would delete, without deleting anything. */
export async function previewUserReset(userId: string): Promise<UserResetPreview> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, isSuperAdmin: true } });
  if (!user) throw new Error('User not found.');

  // The super-admin account is protected regardless of its email domain —
  // do not rely on isInternalEmail() alone, since a super-admin could exist
  // with a non-@deliveryclarity.app address.
  if (user.isSuperAdmin) {
    return {
      userId: user.id, email: user.email,
      importLogs: 0, dashboardSnapshots: 0, jiraConnections: 0, hasScopedMetricsFile: false,
      blocked: true,
      blockedReason: `${user.email} is the protected super-admin account and cannot be reset through this tool.`,
    };
  }

  if (isInternalEmail(user.email)) {
    return {
      userId: user.id, email: user.email,
      importLogs: 0, dashboardSnapshots: 0, jiraConnections: 0, hasScopedMetricsFile: false,
      blocked: true,
      blockedReason: `${user.email} is an internal ${INTERNAL_EMAIL_DOMAIN} account and cannot be reset through this tool.`,
    };
  }

  const [importLogs, dashboardSnapshots, jiraConnections, scopedFilePath] = await Promise.all([
    prisma.importLog.count({ where: { userId } }),
    prisma.dashboardSnapshot.count({ where: { userId } }),
    prisma.jiraConnection.count({ where: { createdByUserId: userId } }),
    resolveScopedFilePath(userId),
  ]);

  return {
    userId: user.id, email: user.email,
    importLogs, dashboardSnapshots, jiraConnections,
    hasScopedMetricsFile: fs.existsSync(scopedFilePath),
    blocked: false,
  };
}

export interface UserResetResult {
  success:                 boolean;
  error?:                  string;
  importLogsDeleted?:      number;
  snapshotsDeleted?:       number;
  jiraConnectionsDeleted?: number;
}

/** Deletes the target user's workspace data. Never touches User/Session/Entitlement. */
export async function resetUserData(userId: string, actorId: string, correlationId?: string): Promise<UserResetResult> {
  const preview = await previewUserReset(userId);
  if (preview.blocked) return { success: false, error: preview.blockedReason };

  const scopedFilePath = await resolveScopedFilePath(userId);

  const [logsRes, snapsRes, connsRes] = await Promise.all([
    prisma.importLog.deleteMany({ where: { userId } }),
    prisma.dashboardSnapshot.deleteMany({ where: { userId } }),
    prisma.jiraConnection.deleteMany({ where: { createdByUserId: userId } }),
  ]);

  try {
    if (fs.existsSync(scopedFilePath)) fs.unlinkSync(scopedFilePath);
  } catch { /* best-effort — DB rows are already gone, a leftover file is stale but harmless */ }

  await safeAuditEvent({
    userId:           actorId,
    eventType:        'user_data_reset',
    eventDescription: `Reset workspace data for ${preview.email} (${userId}): ${logsRes.count} import logs, ${snapsRes.count} snapshots, ${connsRes.count} Jira connections deleted.`,
    correlationId,
  });

  return {
    success: true,
    importLogsDeleted: logsRes.count,
    snapshotsDeleted: snapsRes.count,
    jiraConnectionsDeleted: connsRes.count,
  };
}

export interface ExternalUserSummary {
  id:    string;
  email: string;
  name:  string;
}

/** Users eligible for this tool — everyone except internal @deliveryclarity.app accounts and the super-admin. */
export async function listExternalUsersEligibleForReset(): Promise<ExternalUserSummary[]> {
  return prisma.user.findMany({
    where: {
      isSuperAdmin: false,
      NOT: { email: { endsWith: INTERNAL_EMAIL_DOMAIN, mode: 'insensitive' } },
    },
    select:  { id: true, email: true, name: true },
    orderBy: { email: 'asc' },
  });
}
