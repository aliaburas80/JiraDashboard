// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// DELETE /api/admin/jira-connections/:id — remove a Jira API connection.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { safeAuditEvent } from '@/lib/system-error-logger';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const connection = await prisma.jiraConnection.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, baseUrl: true },
  });

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found.' }, { status: 404 });
  }

  await prisma.jiraConnection.delete({ where: { id: connection.id } });

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'jira_connection_delete',
    eventDescription: `${session.email} deleted Jira connection "${connection.name}" (${connection.baseUrl}).`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true, deletedConnectionId: connection.id });
}

export const dynamic = 'force-dynamic';
