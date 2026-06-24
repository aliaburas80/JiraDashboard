// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET /api/coaching/admin-signals — admin-only operational signals for the
// Admin coaching category (RBC-09). Read-only.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { getAdminCoachingSignals } from '@/services/coaching/adminSignals.service';

export async function GET(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const signals = await getAdminCoachingSignals();
  return NextResponse.json(signals);
}
