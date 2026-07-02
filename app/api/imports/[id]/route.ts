// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// DELETE /api/imports/:id — delete a specific import log
// User can delete their own. Admin can delete any.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { deleteImportLog } from '@/services/settings/dataRetention.service';
import { getWorkspaceForUser } from '@/lib/workspace';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const isAdmin = session.role === 'admin';
  const workspace = isAdmin ? null : await getWorkspaceForUser(session.userId).catch(() => null);
  const result = await deleteImportLog(params.id, session.userId, isAdmin, workspace?.id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: result.error?.includes('not found') ? 404 : 403 });

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
