// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-04: self-service account deletion (soft-then-hard) and full-account
// export. The actual scheduled hard-delete/retention-purge job is a
// standalone script (scripts/purge-expired-data.mjs, run via a GitHub
// Actions cron) rather than importing these functions directly — this
// module's exports are the ones used from real HTTP request handlers.

import { prisma } from '@/lib/prisma';
import { getMetricsScopeKeyForUser } from '@/lib/workspace';
import { readLatestMetrics } from '@/services/metrics/latestMetricsStorage';
import { deleteReportSharesForUser } from '@/server/sharing/reportShareCleanup.service';

// ── Request / cancel deletion ──────────────────────────────────────────────────

export async function requestAccountDeletion(userId: string): Promise<void> {
  // Report shares live in AppSetting without a User FK, so they would not be
  // covered by the later cascade delete. Remove them before locking the account
  // so an account-deletion request can never leave a public report reachable.
  await deleteReportSharesForUser(userId);
  await prisma.user.update({
    where: { id: userId },
    data:  { isActive: false, deletionRequestedAt: new Date() },
  });
}

export async function cancelAccountDeletion(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:  { deletionRequestedAt: null },
  });
}

// ── Export ────────────────────────────────────────────────────────────────────

export interface AccountExport {
  exportedAt: string;
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
    persona: string;
    secondaryPersonas: string[];
    dataStorageMode: string;
    emailVerified: boolean;
    createdAt: string;
    termsAcceptedAt: string | null;
    termsVersion: string;
  };
  consents: Array<{ purpose: string; granted: boolean; version: string; source: string; createdAt: string }>;
  entitlement: { status: string; consumedAt: string | null; expiresAt: string | null } | null;
  workspace: { id: string; name: string; slug: string } | null;
  importLogs: Array<{ id: string; fileName: string | null; status: string; totalIssues: number; healthScore: number; uploadedAt: string }>;
  snapshots: Array<{ id: string; snapshotName: string; metricsJson: string; createdAt: string }>;
  currentMetrics: unknown;
}

export async function exportAccountData(userId: string): Promise<AccountExport> {
  const [user, consents, entitlement, workspace, importLogs, snapshots] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where:  { id: userId },
      select: {
        id: true, name: true, email: true, role: true, persona: true, secondaryPersonas: true,
        dataStorageMode: true, emailVerified: true, createdAt: true, termsAcceptedAt: true, termsVersion: true,
      },
    }),
    prisma.consent.findMany({
      where:   { userId },
      orderBy: { createdAt: 'asc' },
      select:  { purpose: true, granted: true, version: true, source: true, createdAt: true },
    }),
    prisma.entitlement.findUnique({
      where:  { userId },
      select: { status: true, consumedAt: true, expiresAt: true },
    }),
    prisma.workspace.findFirst({
      where:  { ownerUserId: userId, status: 'active' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.importLog.findMany({
      where:   { userId },
      orderBy: { uploadedAt: 'asc' },
      select:  { id: true, fileName: true, status: true, totalIssues: true, healthScore: true, uploadedAt: true },
    }),
    prisma.dashboardSnapshot.findMany({
      where:   { userId },
      orderBy: { createdAt: 'asc' },
      select:  { id: true, snapshotName: true, metricsJson: true, createdAt: true },
    }),
  ]);

  // Local-storage-mode users' data never leaves their browser (EP-017) — there
  // is nothing server-side to include here for that population; not a gap.
  const scopeKey = await getMetricsScopeKeyForUser(userId);
  const currentMetrics = readLatestMetrics(scopeKey)?.metrics ?? null;

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      persona: user.persona,
      secondaryPersonas: user.secondaryPersonas,
      dataStorageMode: user.dataStorageMode,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
      termsVersion: user.termsVersion,
    },
    consents: consents.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    entitlement: entitlement
      ? { status: entitlement.status, consumedAt: entitlement.consumedAt?.toISOString() ?? null, expiresAt: entitlement.expiresAt?.toISOString() ?? null }
      : null,
    workspace,
    importLogs: importLogs.map(l => ({ ...l, uploadedAt: l.uploadedAt.toISOString() })),
    snapshots: snapshots.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })),
    currentMetrics,
  };
}
