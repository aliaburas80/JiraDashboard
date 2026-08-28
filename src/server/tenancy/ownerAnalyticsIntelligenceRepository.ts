// Deployment-wide product intelligence reads for owner-only Admin analytics.
// Cross-organization access stays inside src/server/tenancy by design.
import { prisma } from '@/lib/prisma';

export const OWNER_ANALYTICS_EVENT_LIMIT = 50_000;

export async function getOwnerAnalyticsIntelligenceData(since: Date) {
  const [events, eventCount, users, organizations, imports, analyticsConsents] = await Promise.all([
    prisma.productAnalyticsEvent.findMany({
      where: { occurredAt: { gte: since } },
      orderBy: { occurredAt: 'asc' },
      take: OWNER_ANALYTICS_EVENT_LIMIT,
      select: {
        eventName: true,
        occurredAt: true,
        userId: true,
        anonymousId: true,
        sessionId: true,
        page: true,
        section: true,
        component: true,
        role: true,
        browserFamily: true,
        deviceCategory: true,
        resultStatus: true,
        durationMs: true,
        propertiesJson: true,
      },
    }),
    prisma.productAnalyticsEvent.count({ where: { occurredAt: { gte: since } } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        organizationId: true,
        name: true,
        email: true,
        persona: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.organization.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        maxSeats: true,
        createdAt: true,
      },
    }),
    prisma.importLog.findMany({
      where: { uploadedAt: { gte: since } },
      orderBy: { uploadedAt: 'asc' },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        status: true,
        sourceType: true,
        totalIssues: true,
        processingTimeMs: true,
        uploadedAt: true,
      },
    }),
    prisma.consent.findMany({
      where: { purpose: 'analytics' },
      orderBy: { createdAt: 'asc' },
      select: {
        userId: true,
        granted: true,
        createdAt: true,
      },
    }),
  ]);

  return { events, eventCount, users, organizations, imports, analyticsConsents };
}

export type OwnerAnalyticsIntelligenceData = Awaited<ReturnType<typeof getOwnerAnalyticsIntelligenceData>>;
export type OwnerAnalyticsEvent = OwnerAnalyticsIntelligenceData['events'][number];
