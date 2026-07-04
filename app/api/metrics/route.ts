// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/metrics — returns whether a successful import exists and its timestamp.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { readImportLogs } from '@/services/imports/importLogs.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  // P0A-04: import status is not public — require an active session.
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const logs = await readImportLogs();
  const successLog = logs.find(log => log.status === 'success');

  if (!successLog) {
    return NextResponse.json({ error: 'No successful import found' }, { status: 404 });
  }

  return NextResponse.json({ available: true, lastImport: successLog.importedAt });
}
