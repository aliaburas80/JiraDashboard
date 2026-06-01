// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// GET    /api/snapshots/:id — load a snapshot's metrics (own only, admin=any)
// DELETE /api/snapshots/:id — delete a specific dashboard snapshot

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { deleteDashboardSnapshot } from '@/services/settings/dataRetention.service';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const snap = await prisma.dashboardSnapshot.findUnique({ where: { id: params.id } });
  if (!snap) return NextResponse.json({ error: 'Snapshot not found.' }, { status: 404 });
  if (snap.userId !== session.userId && session.role !== 'admin') {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  return NextResponse.json({
    id:           snap.id,
    snapshotName: snap.snapshotName,
    createdAt:    snap.createdAt,
    metricsJson:  snap.metricsJson,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const result = await deleteDashboardSnapshot(params.id, session.userId, session.role === 'admin');
  if (!result.success) return NextResponse.json({ error: result.error }, { status: result.error?.includes('not found') ? 404 : 403 });

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
