// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// GET /api/imports — returns import logs for the current user.
// Admins can pass ?all=true to see all users' logs.

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { readImportLogs } from '@/services/imports/importLogs.service';

export async function GET(req: NextRequest) {
  // Try DB logs first (F3 auth)
  try {
    const res     = new NextResponse();
    const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);

    if (session.isLoggedIn) {
      const isAdmin = session.role === 'admin';
      const showAll = isAdmin && req.nextUrl.searchParams.get('all') === 'true';

      const logs = await prisma.importLog.findMany({
        where:   showAll ? {} : { userId: session.userId },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { uploadedAt: 'desc' },
        take:    100,
      });

      return NextResponse.json({ logs, source: 'db' });
    }
  } catch {
    // Prisma not configured — fall through to file-based logs
  }

  // Fallback: file-based logs (works without auth)
  try {
    const logs = readImportLogs();
    return NextResponse.json({ logs, source: 'file' });
  } catch {
    return NextResponse.json({ error: 'Failed to read import logs' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
