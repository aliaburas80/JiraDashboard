// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET /api/user-add-requests/mine — returns the current user's own submitted requests.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const requests = await prisma.userAddRequest.findMany({
    where: { requestedByUserId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    requests: requests.map(r => ({
      id: r.id,
      requestedName: r.requestedName,
      requestedEmail: r.requestedEmail,
      requestedRole: r.requestedRole,
      reason: r.reason,
      teamOrProject: r.teamOrProject,
      notes: r.notes,
      status: r.status,
      adminDecisionAt: r.adminDecisionAt?.toISOString() ?? null,
      adminDecisionNote: r.adminDecisionNote ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export const dynamic = 'force-dynamic';
