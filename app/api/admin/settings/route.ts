// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/settings — return current retention settings + stats
// POST /api/admin/settings — update retention settings (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readSettingsForUser, writeSettingsForUser } from '@/services/settings/settings.service';
import { getRetentionStats } from '@/services/settings/dataRetention.service';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { getRequestId } from '@/lib/requestId';
import type { RetentionSettings } from '@/types/settings';

async function requireAdmin(req: NextRequest): Promise<{ session: SessionData } | NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return { session };
}

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;

  const settings = await readSettingsForUser(check.session.userId);
  const stats    = await getRetentionStats(settings).catch(() => null);
  return NextResponse.json({ settings, stats });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin(req);
  if (check instanceof NextResponse) return check;
  const { session } = check;

  let body: Partial<RetentionSettings>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const current  = await readSettingsForUser(session.userId);
  const updated: RetentionSettings = {
    ...current,
    ...body,
    updatedAt: new Date().toISOString(),
    updatedBy: session.email,
  };

  await writeSettingsForUser(updated, {
    userId: session.userId,
    isSuperAdmin: session.isSuperAdmin === true,
    updatedBy: session.email,
  });

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_retention_settings_updated',
    eventDescription: `${session.email} updated data retention settings.`,
    correlationId: getRequestId(req),
  });

  return NextResponse.json({ ok: true, settings: updated });
}

export const dynamic = 'force-dynamic';
