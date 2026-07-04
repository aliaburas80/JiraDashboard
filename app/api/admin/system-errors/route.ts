// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/system-errors            — list all system error logs
// POST /api/admin/system-errors?action=retry — retry a logged operation
// PATCH /api/admin/system-errors           — mark one or all resolved

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { safeAuditEvent, safeNotifications } from '@/lib/system-error-logger';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn)      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const url    = new URL(req.url);
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 500);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
  const filter = url.searchParams.get('resolution') ?? undefined;

  const [errors, total] = await Promise.all([
    prisma.systemErrorLog.findMany({
      where:   filter ? { resolution: filter } : undefined,
      orderBy: { createdAt: 'desc' },
      take:    limit,
      skip:    offset,
    }),
    prisma.systemErrorLog.count({
      where: filter ? { resolution: filter } : undefined,
    }),
  ]);

  return NextResponse.json({ errors, total });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const session = auth as SessionData;

  const action = new URL(req.url).searchParams.get('action');
  if (action !== 'retry') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  let body: { id?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  if (!body.id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const log = await prisma.systemErrorLog.findUnique({ where: { id: body.id } });
  if (!log) return NextResponse.json({ error: 'Error log not found.' }, { status: 404 });

  let retryResult = 'retried';
  try {
    const payload = log.payload ? JSON.parse(log.payload) : null;

    if (log.operation === 'auditEvent.create' && payload) {
      await safeAuditEvent({
        userId:           payload.userId ?? session.userId,
        eventType:        payload.eventType ?? 'retry',
        eventDescription: payload.eventDescription ?? `Retried by ${session.email}`,
        ipAddress:        payload.ipAddress,
        userAgent:        payload.userAgent,
      });
      retryResult = 'retried: auditEvent written';
    } else if (log.operation.includes('notification') && Array.isArray(payload)) {
      await safeNotifications(payload, `retry of ${log.id}`);
      retryResult = 'retried: notifications sent';
    } else {
      retryResult = 'skipped: no retry handler for this operation';
    }

    await prisma.systemErrorLog.update({
      where: { id: body.id },
      data:  {
        resolution:    retryResult,
        retryCount:    { increment: 1 },
        lastRetriedAt: new Date(),
        resolvedAt:    new Date(),
      },
    });

    return NextResponse.json({ ok: true, result: retryResult });
  } catch (err) {
    await prisma.systemErrorLog.update({
      where: { id: body.id },
      data:  { retryCount: { increment: 1 }, lastRetriedAt: new Date() },
    });
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: { id?: string; all?: boolean } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  if (body.all) {
    await prisma.systemErrorLog.updateMany({
      where: { resolvedAt: null },
      data:  { resolution: 'resolved', resolvedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (!body.id) return NextResponse.json({ error: 'id or all required.' }, { status: 400 });

  await prisma.systemErrorLog.update({
    where: { id: body.id },
    data:  { resolution: 'resolved', resolvedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
