// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// DELETE /api/imports/all — delete all import logs for the current user
// Admin can pass ?userId=xxx to delete logs for any user

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { deleteAllUserLogs } from '@/services/settings/dataRetention.service';

export async function DELETE(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const isAdmin  = session.role === 'admin';
  const targetId = isAdmin
    ? (req.nextUrl.searchParams.get('userId') ?? session.userId)
    : session.userId;

  const result = await deleteAllUserLogs(targetId, session.userId, isAdmin);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 403 });

  return NextResponse.json({ ok: true, deleted: result.deleted });
}

export const dynamic = 'force-dynamic';
