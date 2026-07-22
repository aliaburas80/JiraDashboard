// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET    /api/snapshots/:id — load a snapshot's metrics (own only, admin=any)
// DELETE /api/snapshots/:id — delete a specific dashboard snapshot

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { deleteDashboardSnapshot } from '@/services/settings/dataRetention.service';
import { prisma } from '@/lib/prisma';
import { getWorkspaceForUser } from '@/lib/workspace';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  // EP-008: workspace-scoped lookup — admins may view any, users only their workspace.
  // Using findFirst with workspaceId scope prevents IDOR: a record belonging to
  // another workspace returns 404, not 403, so no existence information leaks.
  const isAdmin = session.role === 'admin';
  let snap;
  if (isAdmin) {
    snap = await prisma.dashboardSnapshot.findUnique({ where: { id: (await params).id } });
  } else {
    const workspace = await getWorkspaceForUser(session.userId);
    snap = await prisma.dashboardSnapshot.findFirst({
      where: { id: (await params).id, workspaceId: workspace?.id ?? '__no_workspace__' },
    });
  }
  if (!snap) return NextResponse.json({ error: 'Snapshot not found.' }, { status: 404 });

  return NextResponse.json({
    id:           snap.id,
    snapshotName: snap.snapshotName,
    createdAt:    snap.createdAt,
    metricsJson:  snap.metricsJson,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const isAdminDel = session.role === 'admin';
  const workspaceDel = isAdminDel ? null : await getWorkspaceForUser(session.userId).catch(() => null);
  const result = await deleteDashboardSnapshot((await params).id, session.userId, isAdminDel, workspaceDel?.id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: result.error?.includes('not found') ? 404 : 403 });

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
