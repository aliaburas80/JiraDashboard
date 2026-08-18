// EP-022: tenant-aware identity chokepoint for the separate admin runtime.
// Authentication begins with a globally unique email before an organization is
// known, so that one identity lookup must live inside the tenancy layer. Every
// returned record carries organizationId forward for subsequent scoped work.

import { prisma } from '@/lib/prisma';

const adminIdentitySelect = {
  id: true,
  organizationId: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  isSuperAdmin: true,
  passwordHash: true,
} as const;

export async function findAdminIdentityByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: adminIdentitySelect,
  });
}

export async function findAdminIdentityById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: adminIdentitySelect,
  });
}

export async function createAdminBoundaryAudit(data: {
  organizationId?: string | null;
  userId?: string;
  eventType: string;
  eventDescription: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditEvent.create({
    data: {
      organizationId: data.organizationId ?? null,
      userId: data.userId,
      eventType: data.eventType,
      eventDescription: data.eventDescription,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}
