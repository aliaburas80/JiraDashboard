// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/feedback — paginated feedback list for admin triage.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sp       = req.nextUrl.searchParams;
  const page     = Math.max(1, Number(sp.get('page')  ?? 1));
  const limit    = Math.min(100, Math.max(1, Number(sp.get('limit') ?? 30)));
  const status   = sp.get('status') || undefined;
  const category = sp.get('category') || undefined;

  const where = {
    ...(status   ? { status }   : {}),
    ...(category ? { category } : {}),
  };

  const [rows, total, statusCounts] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      // P0B-09: never select screenshotData in bulk here — a page of 30 rows
      // could otherwise carry tens of MB of base64 image data. Full images
      // are fetched lazily, one at a time, via GET /api/admin/feedback/[id]/screenshot.
      select: {
        id: true, category: true, message: true, impactLevel: true, canContact: true,
        page: true, appVersion: true, browserFamily: true, status: true, statusNote: true,
        userId: true, userEmail: true, createdAt: true, screenshotData: true,
      },
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.groupBy({
      by:    ['status'],
      _count: { status: true },
    }),
  ]);

  const items = rows.map(({ screenshotData, ...rest }) => ({ ...rest, hasScreenshot: !!screenshotData }));

  const counts: Record<string, number> = {};
  for (const row of statusCounts) {
    counts[row.status] = row._count.status;
  }

  return NextResponse.json({ items, total, page, limit, pages: Math.ceil(total / limit), counts });
}
