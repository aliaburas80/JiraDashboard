// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/admin/cleanup — trigger manual retention cleanup (admin only)
// POST /api/admin/cleanup?action=clear_all — clear ALL data (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readSettingsForUser } from '@/services/settings/settings.service';
import { applyRetentionPolicy, clearAllData } from '@/services/settings/dataRetention.service';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { getRequestId } from '@/lib/requestId';

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const action = req.nextUrl.searchParams.get('action');

  if (action === 'clear_all') {
    const result = await clearAllData(session.userId);
    await safeAuditEvent({
      userId: session.userId,
      eventType: 'admin_clear_all_data',
      eventDescription: `${session.email} triggered a manual clear-all-data operation.`,
      correlationId: getRequestId(req),
    });
    return NextResponse.json({ ok: true, ...result });
  }

  // P0B-04: was reading the legacy filesystem-only readSettings() here, which
  // is disconnected from what an admin actually saves via the Settings UI
  // (POST /api/admin/settings writes through readSettingsForUser's DB-backed
  // store) — a real pre-existing inconsistency, fixed while this file was
  // already being touched for the scheduled-purge-job work below.
  const settings = await readSettingsForUser(session.userId);
  const result   = await applyRetentionPolicy(settings, session.userId);
  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_retention_cleanup_run',
    eventDescription: `${session.email} triggered a manual retention cleanup.`,
    correlationId: getRequestId(req),
  });
  return NextResponse.json({ ok: true, ...result });
}

export const dynamic = 'force-dynamic';
