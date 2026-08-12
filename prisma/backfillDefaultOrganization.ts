// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// ORG-04 Phase 1b (product/MULTI_TENANT_ORG_DESIGN.md §9) — one-time backfill.
//
// Creates exactly one "default" Organization for this existing single-tenant
// deployment and points every existing row at it. Must run AFTER migration
// 20260809000001_add_organization_nullable (nullable columns exist) and
// BEFORE the follow-up migration that tightens organizationId to NOT NULL —
// that tighten step would otherwise fail outright against existing rows.
//
// Idempotent: safe to re-run. If a default org already exists (matched by a
// dedicated isDefault flag stored via a well-known domain sentinel — see
// DEFAULT_ORG_DOMAIN_FALLBACK below — or simply because every row is already
// backfilled), it reuses it rather than creating a second one.
//
// Run: npx tsx prisma/backfillDefaultOrganization.ts [--dry-run]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'proton.me', 'live.com', 'msn.com',
]);

const DEFAULT_ORG_DOMAIN_FALLBACK = 'default.deliveryclarity.local';
const DEFAULT_ORG_NAME = 'Default Organization';

function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at === -1) return null;
  return email.slice(at + 1).toLowerCase();
}

async function resolveDefaultOrgDomain(): Promise<string> {
  // Design doc §9.2: seed from the existing admin's email domain, unless
  // that email is a personal/free-provider address (e.g. Gmail used during
  // development) — in that case use a placeholder an admin must later
  // confirm/correct, rather than registering a domain the deployment
  // doesn't actually control.
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    orderBy: { createdAt: 'asc' },
    select: { email: true },
  });

  const domain = admin ? domainFromEmail(admin.email) : null;
  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) return domain;
  return DEFAULT_ORG_DOMAIN_FALLBACK;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const [userCount, importLogCount, snapshotCount, auditEventCount, requestCount, notificationCount, connectionCount] =
    await Promise.all([
      prisma.user.count({ where: { organizationId: null } }),
      prisma.importLog.count({ where: { organizationId: null } }),
      prisma.dashboardSnapshot.count({ where: { organizationId: null } }),
      prisma.auditEvent.count({ where: { organizationId: null } }),
      prisma.userAddRequest.count({ where: { organizationId: null } }),
      prisma.notification.count({ where: { organizationId: null } }),
      prisma.jiraConnection.count({ where: { organizationId: null } }),
    ]);

  console.log('Rows currently missing organizationId:');
  console.log(`  User:               ${userCount}`);
  console.log(`  ImportLog:          ${importLogCount}`);
  console.log(`  DashboardSnapshot:  ${snapshotCount}`);
  console.log(`  AuditEvent:         ${auditEventCount} (stays nullable — will still be backfilled where possible)`);
  console.log(`  UserAddRequest:     ${requestCount}`);
  console.log(`  Notification:       ${notificationCount}`);
  console.log(`  JiraConnection:     ${connectionCount}`);

  if (userCount === 0 && importLogCount === 0 && snapshotCount === 0 && requestCount === 0 && notificationCount === 0 && connectionCount === 0) {
    console.log('\nNothing to backfill — every row already has an organizationId.');
    return;
  }

  const domain = await resolveDefaultOrgDomain();
  console.log(`\nDefault organization domain resolved to: ${domain}`);

  if (dryRun) {
    console.log('\n--dry-run: no data was read beyond the counts above, and nothing was written.');
    return;
  }

  const org = await prisma.organization.upsert({
    where: { domain },
    update: {},
    create: { name: DEFAULT_ORG_NAME, domain, maxSeats: 6 },
  });
  console.log(`\nOrganization ready: ${org.id} (${org.domain})`);

  const [users, importLogs, snapshots, auditEvents, requests, notifications, connections] = await Promise.all([
    prisma.user.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.importLog.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.dashboardSnapshot.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.auditEvent.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.userAddRequest.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.notification.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.jiraConnection.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
  ]);

  console.log('\nBackfilled:');
  console.log(`  User:               ${users.count}`);
  console.log(`  ImportLog:          ${importLogs.count}`);
  console.log(`  DashboardSnapshot:  ${snapshots.count}`);
  console.log(`  AuditEvent:         ${auditEvents.count}`);
  console.log(`  UserAddRequest:     ${requests.count}`);
  console.log(`  Notification:       ${notifications.count}`);
  console.log(`  JiraConnection:     ${connections.count}`);
  console.log('\nDone. Every existing row now belongs to the default organization.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
