// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// GET  /api/snapshots — list the current user's saved snapshots
// POST /api/snapshots — save current metrics as a named snapshot

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const snapshots = await prisma.dashboardSnapshot.findMany({
    where:   { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, snapshotName: true, createdAt: true, importLogId: true },
  });

  return NextResponse.json({ snapshots });
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body: { snapshotName?: string; metricsJson?: string; importLogId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { snapshotName, metricsJson, importLogId } = body;
  if (!snapshotName?.trim()) return NextResponse.json({ error: 'Snapshot name is required.' }, { status: 400 });
  if (!metricsJson) return NextResponse.json({ error: 'Metrics data is required.' }, { status: 400 });

  // Cap at 20 snapshots per user
  const count = await prisma.dashboardSnapshot.count({ where: { userId: session.userId } });
  if (count >= 20) {
    return NextResponse.json({ error: 'Snapshot limit reached (20). Delete an old snapshot first.' }, { status: 400 });
  }

  const snapshot = await prisma.dashboardSnapshot.create({
    data: {
      userId:       session.userId,
      snapshotName: snapshotName.trim(),
      metricsJson,
      importLogId:  importLogId ?? null,
    },
  });

  await prisma.auditEvent.create({ data: {
    userId:           session.userId,
    eventType:        'save_snapshot',
    eventDescription: `Snapshot saved: "${snapshotName.trim()}"`,
  }}).catch(() => {});

  return NextResponse.json({ ok: true, snapshot: { id: snapshot.id, snapshotName: snapshot.snapshotName, createdAt: snapshot.createdAt } }, { status: 201 });
}

export const dynamic = 'force-dynamic';
