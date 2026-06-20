// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET  /api/admin/jira-connections — list connections (admin only)
// POST /api/admin/jira-connections — create a connection (admin only)
//
// ARCH-05 Phase 1 (JIRA-05) — see product/JIRA_INTEGRATION_DESIGN.md.
// The Jira API token is never accepted in this route's body and never
// stored on JiraConnection — it lives only in GATEWAY_JIRA_API_TOKEN (env),
// per the design doc's auth model (§2).

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { safeAuditEvent } from '@/lib/system-error-logger';

const DEPLOYMENT_TYPES = ['cloud', 'server'];

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

function hasGatewayToken(): boolean {
  return !!process.env.GATEWAY_JIRA_API_TOKEN?.trim();
}

function serializeConnection(c: {
  id: string; name: string; deploymentType: string; baseUrl: string; authEmail: string | null;
  projectFilters: string; fieldMapping: string; refreshMode: string; refreshIntervalMinutes: number;
  lastSyncAt: Date | null; lastSyncStatus: string | null; lastSyncError: string | null; createdAt: Date;
}) {
  return {
    id: c.id,
    name: c.name,
    deploymentType: c.deploymentType,
    baseUrl: c.baseUrl,
    authEmail: c.authEmail,
    projectFilters: JSON.parse(c.projectFilters) as string[],
    fieldMapping: JSON.parse(c.fieldMapping) as Record<string, string>,
    refreshMode: c.refreshMode,
    refreshIntervalMinutes: c.refreshIntervalMinutes,
    lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
    lastSyncStatus: c.lastSyncStatus,
    lastSyncError: c.lastSyncError,
    createdAt: c.createdAt.toISOString(),
    // Never a real secret — just tells the UI whether the gateway token is configured.
    hasGatewayToken: hasGatewayToken(),
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const connections = await prisma.jiraConnection.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ connections: connections.map(serializeConnection) });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  let body: {
    name?: string;
    deploymentType?: string;
    baseUrl?: string;
    authEmail?: string;
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
