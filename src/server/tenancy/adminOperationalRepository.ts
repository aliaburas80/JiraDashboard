// EP-024: tenant-safe data access for the separate Admin application.
// All organization-scoped Prisma access for operational admin pages is kept
// inside the tenancy boundary so the separate runtime cannot accidentally
// expose another organization's users or audit history.

import { prisma } from '@/lib/prisma';
import { createWorkspaceForUser } from '@/lib/workspace';
import { createEntitlementForUser } from '@/lib/entitlement';

export interface AdminUserCreateInput {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}

export async function listOrganizationUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { importLogs: true, snapshots: true } } },
  });
}

export async function findOrganizationUserById(organizationId: string, userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, organizationId },
    include: { _count: { select: { importLogs: true, snapshots: true } } },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createOrganizationUser(organizationId: string, input: AdminUserCreateInput) {
  return prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        organizationId,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        mustChangePassword: true,
      },
      include: { _count: { select: { importLogs: true, snapshots: true } } },
    });

    const workspace = await createWorkspaceForUser(tx, user.id, user.name);
    await createEntitlementForUser(tx, user.id, workspace.id);
    return user;
  });
}

export async function updateOrganizationUser(
  organizationId: string,
  userId: string,
  data: { name?: string; role?: string; isActive?: boolean; deletionRequestedAt?: null },
) {
  const target = await prisma.user.findFirst({ where: { id: userId, organizationId } });
  if (!target) return null;
  return prisma.user.update({
    where: { id: userId },
    data,
    include: { _count: { select: { importLogs: true, snapshots: true } } },
  });
}

export async function deleteOrganizationUser(organizationId: string, userId: string) {
  const target = await prisma.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, email: true, isSuperAdmin: true },
  });
  if (!target) return null;
  await prisma.userAddRequest.updateMany({
    where: { organizationId, requestedEmail: target.email, status: 'pending' },
    data: { status: 'cancelled' },
  });
  await prisma.user.delete({ where: { id: userId } });
  return target;
}

export async function listOrganizationAuditEvents(
  organizationId: string,
  options: { take?: number; eventType?: string; search?: string } = {},
) {
  const take = Math.min(Math.max(options.take ?? 100, 1), 500);
  const search = options.search?.trim();
  return prisma.auditEvent.findMany({
    where: {
      organizationId,
      ...(options.eventType ? { eventType: options.eventType } : {}),
      ...(search ? {
        OR: [
          { eventDescription: { contains: search, mode: 'insensitive' } },
          { eventType: { contains: search, mode: 'insensitive' } },
          { correlationId: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

export async function organizationAuditStats(organizationId: string) {
  const since = new Date(Date.now() - 24 * 60 * 60_000);
  const [total, last24h, failedMfa, logins] = await Promise.all([
    prisma.auditEvent.count({ where: { organizationId } }),
    prisma.auditEvent.count({ where: { organizationId, createdAt: { gte: since } } }),
    prisma.auditEvent.count({ where: { organizationId, eventType: 'admin_mfa_failed', createdAt: { gte: since } } }),
    prisma.auditEvent.count({ where: { organizationId, eventType: { in: ['login', 'admin_console_login'] }, createdAt: { gte: since } } }),
  ]);
  return { total, last24h, failedMfa, logins };
}

export async function organizationUserIds(organizationId: string): Promise<string[]> {
  const rows = await prisma.user.findMany({ where: { organizationId }, select: { id: true } });
  return rows.map(row => row.id);
}

export async function listOrganizationFeedback(organizationId: string, take = 200) {
  const userIds = await organizationUserIds(organizationId);
  return prisma.feedback.findMany({
    where: userIds.length ? { userId: { in: userIds } } : { id: '__none__' },
    select: {
      id: true,
      category: true,
      message: true,
      impactLevel: true,
      canContact: true,
      page: true,
      appVersion: true,
      browserFamily: true,
      status: true,
      statusNote: true,
      userId: true,
      userEmail: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(take, 1), 500),
  });
}

export async function updateOrganizationFeedback(
  organizationId: string,
  feedbackId: string,
  data: { status?: string; statusNote?: string | null },
) {
  const userIds = await organizationUserIds(organizationId);
  const existing = await prisma.feedback.findFirst({
    where: { id: feedbackId, userId: { in: userIds } },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.feedback.update({ where: { id: feedbackId }, data });
}

export async function createOrganizationAuditEvent(data: {
  organizationId: string;
  userId: string;
  eventType: string;
  eventDescription: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditEvent.create({ data });
}

/**
 * Deliberate deployment-wide read used only after requireOwnerAdmin(). Keeping
 * these org-scoped model calls inside the tenancy boundary makes the global
 * scope explicit and prevents ordinary Admin routes from copying it casually.
 */
export async function getOwnerDeploymentDiagnostics() {
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

  return {
    totalUsers,
    activeUsers,
    adminUsers,
    totalSessions,
    activeSessions,
    totalImports,
    successImports,
    failedImports,
    avgHealthScore: avgHealthScore._avg.healthScore ?? 0,
    avgProcessingMs: avgProcessingMs._avg.processingTimeMs ?? 0,
    totalSnapshots,
    totalAuditEvents,
    unresolvedSystemErrors,
    latestError,
  };
}

export async function findLatestOrganizationJiraConnection(organizationId: string) {
  return prisma.jiraConnection.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export async function retryAuditEventPayload(payload: unknown, fallbackUserId: string): Promise<boolean> {
  const record = asRecord(payload);
  if (!record) return false;

  const eventType = optionalString(record.eventType) ?? 'retry';
  const eventDescription = optionalString(record.eventDescription) ?? 'Retried from the separate Admin console.';
  const userId = optionalString(record.userId) ?? fallbackUserId;
  const organizationId = optionalString(record.organizationId) ?? null;

  await prisma.auditEvent.create({
    data: {
      organizationId,
      userId,
      eventType,
      eventDescription,
      ipAddress: optionalString(record.ipAddress),
      userAgent: optionalString(record.userAgent),
      correlationId: optionalString(record.correlationId),
    },
  });
  return true;
}

export async function retryNotificationPayload(payload: unknown): Promise<boolean> {
  if (!Array.isArray(payload)) return false;

  const rows = payload.flatMap(value => {
    const record = asRecord(value);
    if (!record) return [];
    const recipientUserId = optionalString(record.recipientUserId);
    const type = optionalString(record.type);
    const title = optionalString(record.title);
    const message = optionalString(record.message);
    if (!recipientUserId || !type || !title || !message) return [];

    return [{
      organizationId: optionalString(record.organizationId),
      recipientUserId,
      type,
      title,
      message,
      relatedEntityType: optionalString(record.relatedEntityType),
      relatedEntityId: optionalString(record.relatedEntityId),
    }];
  });

  if (rows.length === 0) return false;
  await prisma.notification.createMany({ data: rows });
  return true;
}
