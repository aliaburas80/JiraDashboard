// Deployment-wide operational reads for the owner-only Product Analytics page.
// Org-scoped Prisma access intentionally stays inside src/server/tenancy so
// ordinary routes cannot accidentally copy cross-organization reads.
import { prisma } from '@/lib/prisma';

export async function getOwnerProductAnalyticsOperationalData(since: Date) {
  const [totalUsers, newUsers, imports] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        persona: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.importLog.findMany({
      where: { uploadedAt: { gte: since } },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        status: true,
        sourceType: true,
        rowCount: true,
        totalIssues: true,
        processingTimeMs: true,
        uploadedAt: true,
      },
    }),
  ]);

  return { totalUsers, newUsers, imports };
}
