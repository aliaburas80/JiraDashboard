// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// PATCH /api/admin/feedback/[id] — update feedback status and optional note.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { safeAuditEvent } from '@/lib/system-error-logger';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['New', 'Reviewing', 'Accepted', 'Planned', 'In Progress', 'Released', 'Rejected'] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }); }

  const status     = String(body.status ?? '');
  const statusNote = body.statusNote != null ? String(body.statusNote).slice(0, 500) : undefined;

  if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const existing = await prisma.feedback.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data:  { status, ...(statusNote !== undefined ? { statusNote } : {}) },
  });

  await safeAuditEvent({
    userId:           session.userId,
    eventType:        'feedback_status_update',
    eventDescription: `Feedback ${id} status changed from ${existing.status} to ${status}`,
    ipAddress:        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
  });

  return NextResponse.json({ ok: true, feedback: updated });
}
