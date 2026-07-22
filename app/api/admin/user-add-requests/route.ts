// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/admin/user-add-requests — admin-only: list all user add requests.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const status = req.nextUrl.searchParams.get('status') ?? undefined;

  const requests = await prisma.userAddRequest.findMany({
    where: status ? { status } : {},
    include: {
      requestedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
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
      requestedBy: r.requestedBy,
      adminDecisionById: r.adminDecisionById,
      adminDecisionAt: r.adminDecisionAt?.toISOString() ?? null,
      adminDecisionNote: r.adminDecisionNote,
      createdUserId: r.createdUserId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export const dynamic = 'force-dynamic';
