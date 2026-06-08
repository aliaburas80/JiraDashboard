// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// POST /api/user-add-requests — logged-in users submit a request to add a new member.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { isAppRole } from '@/lib/roles';

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: {
    requestedName?: string;
    requestedEmail?: string;
    requestedRole?: string;
    reason?: string;
    teamOrProject?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const requestedName = body.requestedName?.trim();
  const requestedEmail = body.requestedEmail?.toLowerCase().trim();
  const requestedRole = body.requestedRole?.trim();
  const reason = body.reason?.trim();
  const teamOrProject = body.teamOrProject?.trim() || null;
  const notes = body.notes?.trim() || null;

  if (!requestedName || !requestedEmail || !requestedRole || !reason) {
    return NextResponse.json(
      { error: 'Name, email, role, and reason are required.' },
      { status: 400 },
    );
  }

  if (!isAppRole(requestedRole)) {
    return NextResponse.json({ error: 'Unsupported role.' }, { status: 400 });
  }

  // Prevent duplicate email: check existing users AND pending requests.
  const [existingUser, pendingRequest] = await Promise.all([
    prisma.user.findUnique({ where: { email: requestedEmail } }),
    prisma.userAddRequest.findFirst({
      where: { requestedEmail, status: 'pending' },
    }),
  ]);

  if (existingUser) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 },
    );
  }
  if (pendingRequest) {
    return NextResponse.json(
      { error: 'A pending request for this email already exists.' },
      { status: 409 },
    );
  }

  const userAddRequest = await prisma.userAddRequest.create({
    data: {
      requestedName,
      requestedEmail,
      requestedRole,
      reason,
      teamOrProject,
      notes,
      requestedByUserId: session.userId,
      status: 'pending',
    },
  });

  try {
    await prisma.auditEvent.create({
      data: {
        userId: session.userId,
        eventType: 'user_add_request_submit',
        eventDescription: `${session.email} submitted a request to add ${requestedEmail} as ${requestedRole}.`,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
    });
  } catch { /* swallow audit write errors */ }

  return NextResponse.json(
    {
      ok: true,
      request: {
        id: userAddRequest.id,
        requestedName: userAddRequest.requestedName,
        requestedEmail: userAddRequest.requestedEmail,
        requestedRole: userAddRequest.requestedRole,
        reason: userAddRequest.reason,
        status: userAddRequest.status,
        createdAt: userAddRequest.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}

export const dynamic = 'force-dynamic';
