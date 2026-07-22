// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET  /api/admin/persona-preview — is the soft-launch persona switcher visible? (any logged-in user can read)
// POST /api/admin/persona-preview — enable/disable it (super-admin only, not just admin)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readPersonaPreviewSettingsFromDb, writePersonaPreviewSettingsToDb } from '@/services/settings/personaPreview.service';
import { safeAuditEvent } from '@/lib/system-error-logger';

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return NextResponse.json({ settings: await readPersonaPreviewSettingsFromDb() });
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!session.isSuperAdmin) {
    return NextResponse.json({ error: 'Only the super-admin can control the persona preview switcher.' }, { status: 403 });
  }

  let body: { enabled?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: '"enabled" must be true or false.' }, { status: 400 });
  }

  const updated = {
    enabled:   body.enabled,
    updatedAt: new Date().toISOString(),
    updatedBy: session.email ?? 'unknown',
  };
  await writePersonaPreviewSettingsToDb(updated, session.email ?? 'unknown');

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_persona_preview_toggled',
    eventDescription: `${session.email} ${body.enabled ? 'enabled' : 'disabled'} the persona preview switcher.`,
  });

  return NextResponse.json({ ok: true, settings: updated });
}

export const dynamic = 'force-dynamic';
