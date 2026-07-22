// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/jira-connections/:id/fields — discover this Jira instance's
// field ID -> name mapping, for a future field-mapping UI step (JIRA-06b).
//
// ARCH-05 Phase 1 — see product/JIRA_INTEGRATION_DESIGN.md §4.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { resolveJiraConnectionToken } from '@/services/jira/connectionCredentials';
import { discoverJiraFields } from '@/services/jira/fieldDiscovery';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const connection = await prisma.jiraConnection.findUnique({ where: { id: (await params).id } });
  if (!connection) {
    return NextResponse.json({ error: 'Connection not found.' }, { status: 404 });
  }

  const tokenResult = resolveJiraConnectionToken(connection);
  if ('error' in tokenResult) {
    return NextResponse.json(
      { error: tokenResult.error },
      { status: 409 },
    );
  }

  const result = await discoverJiraFields({
    baseUrl: connection.baseUrl,
    deploymentType: connection.deploymentType,
    authEmail: connection.authEmail,
    token: tokenResult.token,
    userId: session.userId,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, fields: result.fields });
}

export const dynamic = 'force-dynamic';
