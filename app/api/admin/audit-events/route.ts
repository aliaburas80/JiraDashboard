// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/audit-events — paginated audit event log for admin console.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import type { Prisma } from '@prisma/client';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sp        = req.nextUrl.searchParams;
  const page      = Math.max(1, Number(sp.get('page')  ?? 1));
  const limit     = Math.min(100, Math.max(1, Number(sp.get('limit') ?? 50)));
  const eventType = sp.get('eventType') || undefined;
  const userId    = sp.get('userId')    || undefined;
  const from      = sp.get('from');
  const to        = sp.get('to');
  const q         = sp.get('q')?.trim() || undefined;

  // MPE-03: free-text search across event description and uploader identity.
  // The event log is genuinely unbounded and already paginates server-side
  // (?page=&limit=), so search must run here too — filtering only the current
  // client-side page would silently miss matches on every other page.
  const searchClause: Prisma.AuditEventWhereInput = q ? {
    OR: [
      { eventDescription: { contains: q, mode: 'insensitive' } },
      { user: { email:    { contains: q, mode: 'insensitive' } } },
      { user: { name:     { contains: q, mode: 'insensitive' } } },
    ],
  } : {};

  const where: Prisma.AuditEventWhereInput = {
    ...(eventType ? { eventType } : {}),
    ...(userId    ? { userId }    : {}),
    ...searchClause,
    ...((from || to) ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      },
    } : {}),
  };

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditEvent.count({ where }),
  ]);

  return NextResponse.json({
    events,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}
