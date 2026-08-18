import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../src/lib/prisma';
import {
  retryAuditEventPayload,
  retryNotificationPayload,
} from '../../../../../src/server/tenancy/adminOperationalRepository';
import { requireOwnerAdmin } from '../../../../lib/adminGuard';
import { safeAdminAudit } from '../../../../lib/auth';

export async function GET(req: NextRequest) {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;

  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '100', 10) || 100, 1), 500);
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0);
  const resolution = url.searchParams.get('resolution')?.trim() || undefined;

  const [errors, total, unresolved] = await Promise.all([
    prisma.systemErrorLog.findMany({
      where: resolution ? { resolution } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.systemErrorLog.count({ where: resolution ? { resolution } : undefined }),
    prisma.systemErrorLog.count({ where: { resolvedAt: null } }),
  ]);

  return NextResponse.json({ errors, total, unresolved });
}

export async function POST(req: NextRequest) {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;
  if (new URL(req.url).searchParams.get('action') !== 'retry') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  let body: { id?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  if (!body.id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const log = await prisma.systemErrorLog.findUnique({ where: { id: body.id } });
  if (!log) return NextResponse.json({ error: 'Error log not found.' }, { status: 404 });

  try {
    const payload: unknown = log.payload ? JSON.parse(log.payload) : null;
    let result = 'skipped: no retry handler for this operation';

    if (log.operation === 'auditEvent.create' && await retryAuditEventPayload(payload, guard.admin.id)) {
      result = 'retried: auditEvent written';
    } else if (log.operation.includes('notification') && await retryNotificationPayload(payload)) {
      result = 'retried: notifications sent';
    }

    await prisma.systemErrorLog.update({
      where: { id: log.id },
      data: {
        resolution: result,
        retryCount: { increment: 1 },
        lastRetriedAt: new Date(),
        resolvedAt: new Date(),
      },
    });

    await safeAdminAudit({
      organizationId: guard.admin.organizationId,
      userId: guard.admin.id,
      eventType: 'admin_system_error_retry',
      eventDescription: `${guard.admin.email} retried system error ${log.id}: ${result}.`,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    await prisma.systemErrorLog.update({
      where: { id: log.id },
      data: { retryCount: { increment: 1 }, lastRetriedAt: new Date() },
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Retry failed.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireOwnerAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: { id?: string; all?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  if (body.all) {
    const result = await prisma.systemErrorLog.updateMany({
      where: { resolvedAt: null },
      data: { resolution: 'resolved', resolvedAt: new Date() },
    });
    await safeAdminAudit({
      organizationId: guard.admin.organizationId,
      userId: guard.admin.id,
      eventType: 'admin_system_errors_resolve_all',
      eventDescription: `${guard.admin.email} resolved ${result.count} system errors from the separate Admin console.`,
    });
    return NextResponse.json({ ok: true, resolved: result.count });
  }

  if (!body.id) return NextResponse.json({ error: 'id or all required.' }, { status: 400 });
  await prisma.systemErrorLog.update({
    where: { id: body.id },
    data: { resolution: 'resolved', resolvedAt: new Date() },
  });
  await safeAdminAudit({
    organizationId: guard.admin.organizationId,
    userId: guard.admin.id,
    eventType: 'admin_system_error_resolve',
    eventDescription: `${guard.admin.email} resolved system error ${body.id} from the separate Admin console.`,
  });
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
