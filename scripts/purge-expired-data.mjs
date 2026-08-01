#!/usr/bin/env node
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-04: scheduled data-lifecycle enforcement, run daily via
// .github/workflows/data-retention.yml (same standalone-script shape as
// prisma/seed.mjs and db-backup.yml — a plain Node/Prisma script, since this
// repo has no ts-node/tsx runtime wired for scripts, and Render's free-tier
// web service has no cron infra of its own).
//
// Four independent jobs, logged separately so a failure in one doesn't hide
// the others' results:
//   1. Hard-delete User rows whose self-requested deletionRequestedAt is
//      older than the grace period (cascades clean up everything else).
//   2. Purge AuditEvent rows older than 12 months (Privacy Policy §6 promise,
//      previously enforced nowhere).
//   3. Purge AppError rows older than 90 days (same — previously unenforced).
//   4. Apply the existing ImportLog/DashboardSnapshot retention policy
//      (src/services/settings/dataRetention.service.ts's applyRetentionPolicy
//      logic, reimplemented inline here) using whatever the admin has saved
//      globally via Settings → Data Retention — a safe no-op by default
//      (DEFAULT_SETTINGS.retentionDays === -1, autoDelete flags both false).
//
// Deliberately NOT purged here (see product/SRS.md P0B-04 entry for why):
// Consent (6-year horizon, no near-term gap), LoginAttempt (already
// self-pruning inline on every login/register call).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCOUNT_DELETION_GRACE_DAYS = 7;
const AUDIT_EVENT_RETENTION_DAYS  = 365; // "12 months"
const APP_ERROR_RETENTION_DAYS    = 90;
const GLOBAL_SETTINGS_OWNER       = 'global';
const RETENTION_SETTINGS_KEY      = 'retention-settings';

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60_000);
}

async function purgeExpiredAccounts() {
  const cutoff = daysAgo(ACCOUNT_DELETION_GRACE_DAYS);
  const due = await prisma.user.findMany({
    where:  { deletionRequestedAt: { lte: cutoff } },
    select: { id: true, email: true },
  });
  for (const user of due) {
    await prisma.user.delete({ where: { id: user.id } });
  }
  return due.length;
}

async function purgeExpiredAuditEvents() {
  const res = await prisma.auditEvent.deleteMany({
    where: { createdAt: { lt: daysAgo(AUDIT_EVENT_RETENTION_DAYS) } },
  });
  return res.count;
}

async function purgeExpiredAppErrors() {
  const res = await prisma.appError.deleteMany({
    where: { lastSeenAt: { lt: daysAgo(APP_ERROR_RETENTION_DAYS) } },
  });
  return res.count;
}

async function applyImportRetentionPolicy() {
  const row = await prisma.appSetting.findUnique({
    where: { ownerId_key: { ownerId: GLOBAL_SETTINGS_OWNER, key: RETENTION_SETTINGS_KEY } },
  });
  if (!row?.valueJson) return { logsDeleted: 0, snapshotsDeleted: 0 };

  let settings;
  try { settings = JSON.parse(row.valueJson); } catch { return { logsDeleted: 0, snapshotsDeleted: 0 }; }

  const retentionDays = settings.retentionDays;
  if (typeof retentionDays !== 'number' || retentionDays === -1) return { logsDeleted: 0, snapshotsDeleted: 0 };
  const cutoff = daysAgo(retentionDays);

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

  return { logsDeleted, snapshotsDeleted };
}

async function main() {
  const accountsDeleted = await purgeExpiredAccounts();
  console.log(`[data-retention] Accounts hard-deleted (past ${ACCOUNT_DELETION_GRACE_DAYS}-day grace period): ${accountsDeleted}`);

  const auditEventsDeleted = await purgeExpiredAuditEvents();
  console.log(`[data-retention] Audit events purged (older than ${AUDIT_EVENT_RETENTION_DAYS} days): ${auditEventsDeleted}`);

  const appErrorsDeleted = await purgeExpiredAppErrors();
  console.log(`[data-retention] App errors purged (older than ${APP_ERROR_RETENTION_DAYS} days): ${appErrorsDeleted}`);

  const { logsDeleted, snapshotsDeleted } = await applyImportRetentionPolicy();
  console.log(`[data-retention] Import logs deleted: ${logsDeleted}, dashboard snapshots deleted: ${snapshotsDeleted} (per current admin-configured retention policy)`);
}

main()
  .catch((err) => {
    console.error('[data-retention] Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
