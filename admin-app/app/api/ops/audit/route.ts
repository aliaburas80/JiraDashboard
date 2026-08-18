import { NextRequest, NextResponse } from 'next/server';
import { requireFullyAuthenticatedAdmin } from '../../../../lib/adminGuard';
import {
  listOrganizationAuditEvents,
  organizationAuditStats,
} from '../../../../../src/server/tenancy/adminOperationalRepository';

export async function GET(req: NextRequest) {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  const url = new URL(req.url);
  const take = Number(url.searchParams.get('take') ?? 100);
  const eventType = url.searchParams.get('eventType')?.trim() || undefined;
  const search = url.searchParams.get('q')?.trim() || undefined;
  const [events, stats] = await Promise.all([
    listOrganizationAuditEvents(guard.admin.organizationId, { take, eventType, search }),
    organizationAuditStats(guard.admin.organizationId),
  ]);

  return NextResponse.json({
    events: events.map(event => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    })),
    stats,
  });
}

export const dynamic = 'force-dynamic';
