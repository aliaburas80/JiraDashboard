// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// GET /api/imports — returns import logs for the current user.
// Admins can pass ?all=true to see all users' logs.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { readImportLogs } from '@/services/imports/importLogs.service';
import { canViewAllImportData } from '@/lib/roles';
import { getWorkspaceForUser } from '@/lib/workspace';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);

    if (session.isLoggedIn) {
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
    }
  } catch {
    // Prisma not configured — fall through to file-based logs
  }

  try {
    const logs = readImportLogs();
    return NextResponse.json({ logs, source: 'file' });
  } catch {
    return NextResponse.json({ error: 'Failed to read import logs' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
