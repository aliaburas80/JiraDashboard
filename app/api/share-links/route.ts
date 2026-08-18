// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { getRequestId } from '@/lib/requestId';
import { createReportShare, listReportShares } from '@/server/sharing/reportShare.service';

export const dynamic = 'force-dynamic';

const ALLOWED_EXPIRY_DAYS = new Set([1, 7, 14, 30, 90]);

async function sessionOrNull(): Promise<SessionData | null> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  return session.isLoggedIn ? session : null;
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}

function parseCreateRequest(value: unknown): { report: unknown; expiresInDays: number | null } | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const expiry = body.expiresInDays;

  let expiresInDays: number | null;
  if (expiry === undefined) {
    expiresInDays = 30;
  } else if (expiry === null) {
    expiresInDays = null;
  } else if (typeof expiry === 'number' && ALLOWED_EXPIRY_DAYS.has(expiry)) {
    expiresInDays = expiry;
  } else {
    return null;
  }

  return { report: body.report, expiresInDays };
}

export async function GET(): Promise<NextResponse> {
  const session = await sessionOrNull();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const shares = await listReportShares(session.userId);
  return NextResponse.json({ shares });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await sessionOrNull();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });

  // EP-017: local mode is an explicit browser-only privacy contract. A public
  // share necessarily persists a report on the server, so fail closed rather
  // than silently uploading a derivative of browser-local Jira data.
  if (session.dataStorageMode === 'local') {
    return NextResponse.json({
      error: 'Client sharing is unavailable in local-storage mode because your report must remain in this browser.',
    }, { status: 409 });
  }

  const json = await req.json().catch(() => null);
  const parsed = parseCreateRequest(json);
  if (!parsed) return NextResponse.json({ error: 'Invalid share request.' }, { status: 400 });

  try {
    const result = await createReportShare({ userId: session.userId, ...parsed });
    await safeAuditEvent({
      userId: session.userId,
      eventType: 'report_share_create',
      eventDescription: `Created read-only report share ${result.share.id}${result.share.expiresAt ? ` expiring ${result.share.expiresAt}` : ' with no expiry'}.`,
      correlationId: getRequestId(req),
    });
    return NextResponse.json({ share: result.share, sharePath: `/share/${result.token}` }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'ACTIVE_SHARE_LIMIT') {
      return NextResponse.json({ error: 'Active share-link limit reached. Revoke an old link first.' }, { status: 409 });
    }
    if (error instanceof Error && error.message === 'INVALID_REPORT') {
      return NextResponse.json({ error: 'Report data is not shareable.' }, { status: 400 });
    }
    throw error;
  }
}
