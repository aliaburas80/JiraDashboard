// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// PATCH /api/admin/user-add-requests/:id/reject — admin rejects a user add request.
// Marks the request rejected, creates a notification for the requester, and writes an audit event.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { roleLabel } from '@/lib/roles';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  let body: { decisionNote?: string } = {};
  try {
    const raw = await req.text();
    if (raw.trim()) body = JSON.parse(raw);
  } catch {
    // decisionNote is optional; ignore parse errors on empty body
  }

  const requestId = params.id;

  const userAddRequest = await prisma.userAddRequest.findUnique({
    where: { id: requestId },
  });

  if (!userAddRequest) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }
  if (userAddRequest.status !== 'pending') {
    return NextResponse.json(
      { error: `Request is already ${userAddRequest.status} and cannot be rejected.` },
      { status: 409 },
    );
  }

  await prisma.userAddRequest.update({
    where: { id: requestId },
    data: {
      status: 'rejected',
      adminDecisionById: session.userId,
      adminDecisionAt: new Date(),
      adminDecisionNote: body.decisionNote?.trim() || null,
    },
  });

  try {
    await prisma.notification.create({
      data: {
        recipientUserId: userAddRequest.requestedByUserId,
        type: 'user_add_request_rejected',
        title: 'User request not approved',
        message: body.decisionNote?.trim()
          ? `Your request to add ${userAddRequest.requestedEmail} as ${roleLabel(userAddRequest.requestedRole)} was not approved. Note from admin: ${body.decisionNote.trim()}`
          : `Your request to add ${userAddRequest.requestedEmail} as ${roleLabel(userAddRequest.requestedRole)} was not approved.`,
        relatedEntityType: 'UserAddRequest',
        relatedEntityId: requestId,
      },
    });
  } catch { /* swallow notification write errors */ }

  try {
    await prisma.auditEvent.create({
      data: {
        userId: session.userId,
        eventType: 'user_add_request_reject',
        eventDescription: `${session.email} rejected request ${requestId} for ${userAddRequest.requestedEmail}.`,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
    });
  } catch { /* swallow audit write errors */ }

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
