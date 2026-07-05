// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/users/:id/reset-preview — dry-run for EP-023's manual
// workspace-data reset. Admin-only. Never deletes anything.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { previewUserReset } from '@/services/settings/userReset.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  try {
    const preview = await previewUserReset(params.id);
    return NextResponse.json({ ok: true, preview });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to build reset preview.';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export const dynamic = 'force-dynamic';
