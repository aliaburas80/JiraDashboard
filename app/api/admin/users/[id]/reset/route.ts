// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/admin/users/:id/reset — EP-023's manual workspace-data reset.
// Admin-only. Deletes the target user's ImportLog/DashboardSnapshot/
// JiraConnection rows and their scoped dashboard metrics file. Never touches
// the User/Session/Entitlement rows — the account itself is untouched.
// Refuses (409) any @deliveryclarity.app internal account, server-side,
// not just hidden in the UI.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { resetUserData } from '@/services/settings/userReset.service';
import { getRequestId } from '@/lib/requestId';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  try {
    const result = await resetUserData((await params).id, session.userId, getRequestId(req));
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to reset user data.';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export const dynamic = 'force-dynamic';
