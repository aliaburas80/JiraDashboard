// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/user-add-requests — logged-in users submit a request to add a new member.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { isAppRole, isHighPrivilegeRole } from '@/lib/roles';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HIGH_PRIVILEGE_MIN_REASON_LENGTH = 20;
import { safeAuditEvent, safeNotifications } from '@/lib/system-error-logger';
import { getRequestId } from '@/lib/requestId';

// Simple in-process rate limiter — 10 submissions per 10 minutes per requester.
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 10;
const SUBMIT_RATE = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const hits = (SUBMIT_RATE.get(userId) ?? []).filter(t => t > now - RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return true;
  SUBMIT_RATE.set(userId, [...hits, now]);
  return false;
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  if (isRateLimited(session.userId)) {
    return NextResponse.json(
      { error: 'Too many requests submitted. Wait 10 minutes before submitting another add-member request.' },
      { status: 429 },
    );
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

  if (!EMAIL_FORMAT.test(requestedEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (!isAppRole(requestedRole)) {
    return NextResponse.json({ error: 'Unsupported role.' }, { status: 400 });
  }

  if (isHighPrivilegeRole(requestedRole) && reason.length < HIGH_PRIVILEGE_MIN_REASON_LENGTH) {
    return NextResponse.json(
      { error: 'Admin and C-level requests require a detailed justification (at least 20 characters).' },
      { status: 400 },
    );
  }

  // Guard: the session userId must still exist in the DB. Iron-session stores
  // the session in the cookie, so a deleted user's cookie remains valid until
  // expiry — this prevents a FK violation on requestedByUserId.
  const [requester, existingUser, pendingRequest] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: requestedEmail } }),
    prisma.userAddRequest.findFirst({
      where: { requestedEmail, status: 'pending' },
    }),
  ]);

  if (!requester) {
    return NextResponse.json({ error: 'Your account no longer exists. Please log out and contact your administrator.' }, { status: 401 });
  }

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

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'user_add_request_submit',
    eventDescription: `${session.email} submitted a request to add ${requestedEmail} as ${requestedRole}.`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
    correlationId: getRequestId(req),
  });

  // Notify all active admins so they can review the pending request.
  const admins = await prisma.user.findMany({
    where: { role: 'admin', isActive: true },
    select: { id: true },
  });
  if (admins.length > 0) {
    await safeNotifications(
      admins.map(admin => ({
        recipientUserId: admin.id,
        type: 'user_add_request_submitted',
        title: '👤 New user add request',
        message: `${session.name} (${session.email}) requested to add ${requestedEmail} as ${requestedRole}${reason ? `: "${reason}"` : ''}. Review in Admin → Users.`,
        relatedEntityType: 'UserAddRequest',
        relatedEntityId: userAddRequest.id,
      })),
      'user_add_request_submit notifications',
    );
  }

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
