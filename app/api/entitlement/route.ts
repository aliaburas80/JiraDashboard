// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET /api/entitlement — returns current user's trial entitlement state.
// Used by the dashboard and upload page to show status/time remaining.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { getEntitlementForUser } from '@/lib/entitlement';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // Admins are always eligible — bypass entitlement check
  if (session.role === 'admin') {
    return NextResponse.json({ status: 'admin', daysLeft: null, consumedAt: null, expiresAt: null });
  }

  const ent = await getEntitlementForUser(session.userId);

  if (!ent) {
    return NextResponse.json({ status: 'eligible', daysLeft: null, consumedAt: null, expiresAt: null });
  }

  return NextResponse.json({
    status:     ent.status,
    daysLeft:   ent.daysLeft,
    consumedAt: ent.consumedAt?.toISOString() ?? null,
    expiresAt:  ent.expiresAt?.toISOString()  ?? null,
  });
}
