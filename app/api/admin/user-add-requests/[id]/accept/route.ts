// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// PATCH /api/admin/user-add-requests/:id/accept — admin accepts a user add request.
// On acceptance: creates the user account (mustChangePassword=true), marks the request accepted,
// creates a notification for the requester, and writes audit events.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { isAppRole, roleLabel } from '@/lib/roles';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

/** Generate a random temporary password that passes validatePasswordStrength. */
function generateTempPassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base = Array.from({ length: 6 }, () => rand(chars)).join('');
  return `${rand(upper)}${base}${rand(digits)}${rand(digits)}`;
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
      { error: `Request is already ${userAddRequest.status} and cannot be accepted.` },
      { status: 409 },
    );
  }

  // Validate role is still a supported AppRole.
  if (!isAppRole(userAddRequest.requestedRole)) {
    return NextResponse.json({ error: 'Requested role is no longer valid.' }, { status: 400 });
  }

  // Guard against duplicate email at the time of acceptance.
  const existingUser = await prisma.user.findUnique({
    where: { email: userAddRequest.requestedEmail },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 },
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  // Atomic sequence: create user → update request → notify → audit.
  const newUser = await prisma.user.create({
    data: {
      name: userAddRequest.requestedName,
      email: userAddRequest.requestedEmail,
      passwordHash,
      role: userAddRequest.requestedRole,
      mustChangePassword: true,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  await prisma.userAddRequest.update({
    where: { id: requestId },
    data: {
      status: 'accepted',
      adminDecisionById: session.userId,
      adminDecisionAt: new Date(),
      adminDecisionNote: body.decisionNote?.trim() || null,
      createdUserId: newUser.id,
    },
  });

  try {
    await prisma.notification.create({
      data: {
        recipientUserId: userAddRequest.requestedByUserId,
        type: 'user_add_request_accepted',
        title: 'User request accepted',
        message: `Your request to add ${userAddRequest.requestedEmail} as ${roleLabel(userAddRequest.requestedRole)} has been approved. The account is ready for first login.`,
        relatedEntityType: 'UserAddRequest',
        relatedEntityId: requestId,
      },
    });
  } catch { /* swallow notification write errors */ }

  try {
    await prisma.auditEvent.create({
      data: {
        userId: session.userId,
        eventType: 'user_add_request_accept',
        eventDescription: `${session.email} accepted request ${requestId} — created user ${newUser.email} with role ${roleLabel(newUser.role)}.`,
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
    });
  } catch { /* swallow audit write errors */ }

  return NextResponse.json({
    ok: true,
    createdUser: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      mustChangePassword: true,
    },
  });
}

export const dynamic = 'force-dynamic';
