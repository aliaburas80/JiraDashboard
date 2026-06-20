// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// POST /api/admin/jira-connections/:id/test — verify the connection's
// credentials work by calling GET /rest/api/{2|3}/myself through the
// Backend Integration Gateway. Never returns the token itself.
//
// ARCH-05 Phase 1 (JIRA-05) — see product/JIRA_INTEGRATION_DESIGN.md §2/§3.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { callExternal } from '@/server/gateway/externalGateway';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

interface JiraMyselfResponse {
  accountId?: string;
  displayName?: string;
  emailAddress?: string;
  name?: string; // Server/DC uses "name" instead of "accountId"/"emailAddress"
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

  const token = process.env.GATEWAY_JIRA_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: 'GATEWAY_JIRA_API_TOKEN is not set. Add it to your environment before testing a connection.' },
      { status: 409 },
    );
  }

  const isCloud = connection.deploymentType === 'cloud';
  if (isCloud && !connection.authEmail) {
    return NextResponse.json({ error: 'This Cloud connection is missing its email address.' }, { status: 409 });
  }

  const authHeader = isCloud
    ? `Basic ${Buffer.from(`${connection.authEmail}:${token}`).toString('base64')}`
    : `Bearer ${token}`;

  const result = await callExternal<JiraMyselfResponse>({
    provider: 'jira',
    operation: 'jira.testConnection',
    method: 'GET',
    path: isCloud ? '/rest/api/3/myself' : '/rest/api/2/myself',
    headers: { Authorization: authHeader, Accept: 'application/json' },
    baseUrlOverride: connection.baseUrl,
    userId: session.userId,
    timeoutMs: 15000,
  });

  if (!result.ok) {
    await prisma.jiraConnection.update({
      where: { id: connection.id },
      data: { lastSyncStatus: 'failed', lastSyncError: result.error ?? 'Unknown error' },
    });
    return NextResponse.json(
      { ok: false, error: result.error ?? 'Connection test failed.', errorCategory: result.errorCategory },
      { status: 502 },
    );
  }

  const account = result.data?.displayName ?? result.data?.name ?? result.data?.emailAddress ?? 'unknown account';
  await prisma.jiraConnection.update({
    where: { id: connection.id },
    data: { lastSyncStatus: 'success', lastSyncError: null },
  });

  return NextResponse.json({ ok: true, account });
}

export const dynamic = 'force-dynamic';
