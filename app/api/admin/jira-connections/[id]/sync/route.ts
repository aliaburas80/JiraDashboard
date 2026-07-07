// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/admin/jira-connections/:id/sync — manual "Sync now" for a specific
// connection, admin-only. All-or-nothing — see runJiraConnectionSync().
//
// ARCH-05 Phase 1 (JIRA-07) — see product/JIRA_INTEGRATION_DESIGN.md §5/§7/§8.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { runJiraConnectionSync } from '@/services/jira/connectionSyncRunner';
import { safeAuditEvent } from '@/lib/system-error-logger';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const connection = await prisma.jiraConnection.findUnique({ where: { id: params.id } });
  if (!connection) {
    return NextResponse.json({ error: 'Connection not found.' }, { status: 404 });
  }

  const result = await runJiraConnectionSync(connection, session.userId);
  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_jira_connection_sync',
    eventDescription: `${session.email} triggered a manual sync for Jira connection "${connection.name}".`,
  });
  return NextResponse.json(result.body, { status: result.status });
}

export const dynamic = 'force-dynamic';
