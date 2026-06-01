// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// POST /api/admin/cleanup — trigger manual retention cleanup (admin only)
// POST /api/admin/cleanup?action=clear_all — clear ALL data (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readSettings } from '@/services/settings/settings.service';
import { applyRetentionPolicy, clearAllData } from '@/services/settings/dataRetention.service';

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const action = req.nextUrl.searchParams.get('action');

  if (action === 'clear_all') {
    const result = await clearAllData(session.userId);
    return NextResponse.json({ ok: true, ...result });
  }

  const settings = readSettings();
  const result   = await applyRetentionPolicy(settings, session.userId);
  return NextResponse.json({ ok: true, ...result });
}

export const dynamic = 'force-dynamic';
