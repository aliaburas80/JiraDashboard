// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/metrics — returns whether a successful import exists and its timestamp.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getWorkspaceForUser } from '@/lib/workspace';

export const dynamic = 'force-dynamic';

export async function GET() {
  // P0A-04: import status is not public — require an active session.
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // P0 fix, 2026-07-08: this used to read readImportLogs() — a single flat
  // file shared by every user on the server — and answer based on whoever
  // most recently uploaded anything, not the caller's own data. Scoped to
  // the caller's own workspace/user, matching every other import-log route.
  const workspace = await getWorkspaceForUser(session.userId);
  const successLog = await prisma.importLog.findFirst({
    where:   { status: 'success', userId: session.userId, ...(workspace ? { workspaceId: workspace.id } : {}) },
    orderBy: { uploadedAt: 'desc' },
    select:  { uploadedAt: true },
  });

  if (!successLog) {
    return NextResponse.json({ error: 'No successful import found' }, { status: 404 });
  }

  return NextResponse.json({ available: true, lastImport: successLog.uploadedAt });
}
