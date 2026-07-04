// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/security — run security checks and return report (admin only)

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { runSecurityChecks } from '@/services/settings/securityCheck.service';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const report = runSecurityChecks();
  return NextResponse.json(report);
}

export const dynamic = 'force-dynamic';
