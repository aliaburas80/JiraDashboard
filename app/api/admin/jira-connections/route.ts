// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/jira-connections — list connections (admin only)
// POST /api/admin/jira-connections — create a connection (admin only)
//
// ARCH-05 Phase 1 (JIRA-05) — see product/JIRA_INTEGRATION_DESIGN.md.
// Jira API tokens/PATs are stored encrypted per JiraConnection so different
// connections can authenticate as different Jira accounts.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { encryptJiraConnectionToken, hasJiraConnectionToken } from '@/services/jira/connectionCredentials';

const DEPLOYMENT_TYPES = ['cloud', 'server'];

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map(item => String(item).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function parseStringRecord(value: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, fieldValue]) => [key, String(fieldValue)]),
    );
  } catch {
    return {};
  }
}

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

function serializeConnection(c: {
  id: string; name: string; deploymentType: string; baseUrl: string; authEmail: string | null;
  apiTokenEncrypted: string | null;
  projectFilters: string; fieldMapping: string; refreshMode: string; refreshIntervalMinutes: number;
  lastSyncAt: Date | null; lastSyncStatus: string | null; lastSyncError: string | null; createdAt: Date;
}) {
  return {
    id: c.id,
    name: c.name,
    deploymentType: c.deploymentType,
    baseUrl: c.baseUrl,
    authEmail: c.authEmail,
    projectFilters: parseStringArray(c.projectFilters),
    fieldMapping: parseStringRecord(c.fieldMapping),
    refreshMode: c.refreshMode,
    refreshIntervalMinutes: c.refreshIntervalMinutes,
    lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
    lastSyncStatus: c.lastSyncStatus,
    lastSyncError: c.lastSyncError,
    createdAt: c.createdAt.toISOString(),
    // Never a real secret — just tells the UI whether this connection has one.
    hasApiToken: hasJiraConnectionToken(c),
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const connections = await prisma.jiraConnection.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ connections: connections.map(c => serializeConnection(c)) });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  let body: {
    name?: string;
    deploymentType?: string;
    baseUrl?: string;
    authEmail?: string;
    apiToken?: string;
    projectFilters?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const name = body.name?.trim();
  const deploymentType = body.deploymentType?.trim();
  const baseUrl = body.baseUrl?.trim();
  const authEmail = body.authEmail?.trim() || null;
  const apiToken = body.apiToken?.trim();
  const projectFilters = Array.isArray(body.projectFilters)
    ? body.projectFilters.map(p => String(p).trim()).filter(Boolean)
    : [];

  if (!name || !deploymentType || !baseUrl) {
    return NextResponse.json({ error: 'Name, deployment type, and base URL are required.' }, { status: 400 });
  }
  if (!DEPLOYMENT_TYPES.includes(deploymentType)) {
    return NextResponse.json({ error: 'Deployment type must be "cloud" or "server".' }, { status: 400 });
  }
  if (deploymentType === 'cloud' && !authEmail) {
    return NextResponse.json({ error: 'Email is required for Jira Cloud connections.' }, { status: 400 });
  }
  if (!apiToken) {
    return NextResponse.json({ error: 'Jira API token / PAT is required.' }, { status: 400 });
  }
  try {
    // eslint-disable-next-line no-new
    new URL(baseUrl);
  } catch {
    return NextResponse.json({ error: 'Base URL is not a valid URL.' }, { status: 400 });
  }

  const connection = await prisma.jiraConnection.create({
    data: {
      name,
      deploymentType,
      baseUrl,
      authEmail,
      apiTokenEncrypted: encryptJiraConnectionToken(apiToken),
      projectFilters: JSON.stringify(projectFilters),
      fieldMapping: JSON.stringify({}),
      createdByUserId: session.userId,
    },
  });

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'jira_connection_create',
    eventDescription: `${session.email} created Jira connection "${name}" (${deploymentType}, ${baseUrl}).`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({ ok: true, connection: serializeConnection(connection) }, { status: 201 });
}

export const dynamic = 'force-dynamic';
