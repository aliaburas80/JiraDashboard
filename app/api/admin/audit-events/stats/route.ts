// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET /api/admin/audit-events/stats — chart data for audit analytics page.
// Returns: totals, events-per-day (30d), events-by-type, journey transitions.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000);
  const todayStart    = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [total, todayCount, allRecent] = await Promise.all([
    prisma.auditEvent.count(),
    prisma.auditEvent.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.auditEvent.findMany({
      where:   { createdAt: { gte: thirtyDaysAgo } },
      orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }],
      select:  { userId: true, eventType: true, createdAt: true },
    }),
  ]);

  // Unique active users in the window.
  const uniqueUsers = new Set(allRecent.map(e => e.userId).filter(Boolean)).size;

  // Events by type — sorted descending.
  const typeMap = new Map<string, number>();
  for (const e of allRecent) {
    typeMap.set(e.eventType, (typeMap.get(e.eventType) ?? 0) + 1);
  }
  const byType = [...typeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  const topEventType = byType[0]?.type ?? '—';

  // Events per calendar day for the last 30 days (including zeros).
  const dayMap = new Map<string, number>();
  for (const e of allRecent) {
    const day = e.createdAt.toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const byDay: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1_000);
    const key = d.toISOString().slice(0, 10);
    byDay.push({ date: key, count: dayMap.get(key) ?? 0 });
  }

  // Journey edges: consecutive event pairs within a 30-minute session window.
  const transitions = new Map<string, number>();
  for (let i = 0; i < allRecent.length - 1; i++) {
    const curr = allRecent[i];
    const next = allRecent[i + 1];
    if (curr.userId && curr.userId === next.userId) {
      const diff = new Date(next.createdAt).getTime() - new Date(curr.createdAt).getTime();
      if (diff < 30 * 60_000) {
        const key = `${curr.eventType}→${next.eventType}`;
        transitions.set(key, (transitions.get(key) ?? 0) + 1);
      }
    }
  }
  const journeyEdges = [...transitions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([key, count]) => {
      const arrow = key.indexOf('→');
      return { from: key.slice(0, arrow), to: key.slice(arrow + 1), count };
    });

  return NextResponse.json({
    total,
    todayCount,
    uniqueUsers,
    topEventType,
    byDay,
    byType,
    journeyEdges,
  });
}
