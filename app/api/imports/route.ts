// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/imports — returns import logs for the current user.
// Admins can pass ?all=true to see all users' logs.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { canViewAllImportData } from '@/lib/roles';
import { getWorkspaceForUser } from '@/lib/workspace';

export async function GET(req: NextRequest) {
  // P0 fix, 2026-07-08: this used to fall through to readImportLogs() — a
  // single flat file shared by every user on the server, with NO auth check
  // and NO per-user scoping — whenever the caller wasn't logged in (or on any
  // transient DB error even for a logged-in user). That meant an
  // unauthenticated request could read every user's upload filenames, row
  // counts, and health scores. There is no legitimate case where this route
  // should ever answer without a valid session or with unscoped data — fail
  // closed instead of silently falling back to the unscoped store.
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const canViewAll = canViewAllImportData(session.role);
    const showAll = canViewAll && req.nextUrl.searchParams.get('all') === 'true';

    // EP-008: scope by workspaceId (workspace boundary is the isolation unit).
    // Admin all=true bypasses workspace scope to view all tenants.
    let workspaceFilter: { workspaceId?: string } = {};
    if (!showAll) {
      const workspace = await getWorkspaceForUser(session.userId);
      workspaceFilter = { workspaceId: workspace?.id };
    }

    const logs = await prisma.importLog.findMany({
      where:   showAll ? {} : { userId: session.userId, ...workspaceFilter },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { uploadedAt: 'desc' },
      take:    100,
    });

    return NextResponse.json({ logs, source: 'db' });
  } catch {
    return NextResponse.json({ error: 'Failed to read import logs.' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
