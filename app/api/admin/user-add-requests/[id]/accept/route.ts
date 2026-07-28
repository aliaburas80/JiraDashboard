// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// PATCH /api/admin/user-add-requests/:id/accept — admin accepts a user add request.
// On acceptance: creates the user account (mustChangePassword=true), marks the request accepted,
// creates a notification for the requester, and writes audit events.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { sendEmail, buildWelcomeEmail, describeSmtpError } from '@/lib/email';
import { invalidateConfig } from '@/lib/app-config';
import { resolveRequestOrigin } from '@/lib/url';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { isAppRole, roleLabel } from '@/lib/roles';
import { safeAuditEvent, safeNotifications } from '@/lib/system-error-logger';
import { getRequestId } from '@/lib/requestId';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  let body: { decisionNote?: string; tempPassword?: string } = {};
  try {
    const raw = await req.text();
    if (raw.trim()) body = JSON.parse(raw);
  } catch {
    // ignore parse errors
  }

  const tempPassword = body.tempPassword?.trim() ?? '';
  if (!tempPassword) {
    return NextResponse.json({ error: 'A temporary password is required.' }, { status: 400 });
  }
  const strengthError = validatePasswordStrength(tempPassword);
  if (strengthError) {
    return NextResponse.json({ error: strengthError }, { status: 400 });
  }

  const requestId = (await params).id;

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

  await safeNotifications([{
    recipientUserId: userAddRequest.requestedByUserId,
    type: 'user_add_request_accepted',
    title: '✅ User request approved',
    message: `Your request to add ${userAddRequest.requestedEmail} as ${roleLabel(userAddRequest.requestedRole)} has been approved.\n\nTemporary password: ${tempPassword}\n\nThe user should log in and change their password immediately on first login.`,
    relatedEntityType: 'UserAddRequest',
    relatedEntityId: requestId,
  }], 'user_add_request accept notification');

  let emailSent = false;
  let emailError: string | undefined;
  try {
    invalidateConfig();
    const appUrl = resolveRequestOrigin(req);
    const welcome = buildWelcomeEmail(newUser.name, newUser.email, tempPassword, appUrl);
    emailSent = await sendEmail({ to: newUser.email, toName: newUser.name, ...welcome });
    if (!emailSent) {
      emailError = 'No email provider is configured (no Resend API key and no SMTP host/username/password set).';
    }
  } catch (err) {
    // Distinguish a genuine send failure (Resend/SMTP rejected it, network error, etc.) from
    // "not configured" above — these used to be indistinguishable to the admin reviewing this.
    emailError = process.env.RESEND_API_KEY
      ? `Resend failed: ${err instanceof Error ? err.message : String(err)}`
      : describeSmtpError(err);
    console.warn('[email] Failed to send welcome email:', err);
  }

  if (emailError) {
    await safeAuditEvent({
      userId: session.userId,
      eventType: 'user_add_request_welcome_email_failed',
      eventDescription: `Welcome email failed for ${newUser.email}: ${emailError}`,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      correlationId: getRequestId(req),
    });
  }

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'user_add_request_accept',
    eventDescription: `${session.email} accepted request ${requestId} — created user ${newUser.email} with role ${roleLabel(newUser.role)}.`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
    correlationId: getRequestId(req),
  });

  return NextResponse.json({
    ok: true,
    emailSent,
    emailError,
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
