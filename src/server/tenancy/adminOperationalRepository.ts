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
