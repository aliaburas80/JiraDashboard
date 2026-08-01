// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/account/export — P0B-04: full self-service account data export
// (GDPR Article 20 data portability). Returns a single downloadable JSON
// document — no CSV/spreadsheet output, so there is no formula-injection
// surface to defend against (CLAUDE.md §38.5).

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { exportAccountData } from '@/lib/accountLifecycle';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const data = await exportAccountData(session.userId);
  const filename = `delivery-clarity-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(data, null, 2), {
    status:  200,
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
