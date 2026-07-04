// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET/POST/PATCH/DELETE /api/admin/users — admin-only user management.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { sendEmail, buildWelcomeEmail, describeSmtpError } from '@/lib/email';
import { getAppConfig, invalidateConfig } from '@/lib/app-config';
import { safeAuditEvent, safeNotifications } from '@/lib/system-error-logger';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { ASSIGNABLE_ROLES, isAppRole, roleLabel, type AppRole } from '@/lib/roles';
import { createWorkspaceForUser } from '@/lib/workspace';
import { createEntitlementForUser } from '@/lib/entitlement';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

function safeUser(user: {
  id: string; name: string; email: string; role: string; isActive: boolean;
  mustChangePassword?: boolean; isSuperAdmin?: boolean;
  createdAt: Date; updatedAt: Date; lastLoginAt: Date | null;
  _count?: { importLogs: number; snapshots: number };
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: isAppRole(user.role) ? user.role : 'user',
    roleLabel: roleLabel(user.role),
    isActive: user.isActive,
    isSuperAdmin: Boolean(user.isSuperAdmin),
    mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    importCount: user._count?.importLogs ?? 0,
    snapshotCount: user._count?.snapshots ?? 0,
  };
}

// EP-016: a super-admin account cannot be modified or deleted by any other admin —
// only by itself (e.g. via /change-password, /profile self-service). There is no
// API surface to grant this flag; it is set directly against the database.
function isProtectedFromActor(
  target: { isSuperAdmin?: boolean | null },
  actorUserId: string,
  targetId: string,
): boolean {
  return Boolean(target.isSuperAdmin) && actorUserId !== targetId;
}

async function syncUsersFromCloudIfConfigured(): Promise<void> {
  try {
    const { syncFromCloud } = await import('@/services/storage/cloudSync');
    await syncFromCloud();
  } catch {
    // Admin user management can continue against the local DB if cloud is unreachable.
  }
}

async function pushUsersToCloudIfConfigured(): Promise<void> {
  try {
    const { pushToCloud } = await import('@/services/storage/cloudSync');
    await pushToCloud();
  } catch {
    // pushToCloud marks pending state on failure; local mutation already succeeded.
  }
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  await syncUsersFromCloudIfConfigured();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { importLogs: true, snapshots: true } } },
  });

  return NextResponse.json({
    users: users.map(safeUser),
    roles: ASSIGNABLE_ROLES.map(id => ({ id, label: roleLabel(id) })),
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  await syncUsersFromCloudIfConfigured();

  let body: { name?: string; email?: string; password?: string; role?: AppRole };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.toLowerCase().trim();
  const role = body.role;

  if (!name || !email || !body.password || !role) {
    return NextResponse.json({ error: 'Name, email, password, and role are required.' }, { status: 400 });
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Unsupported role.' }, { status: 400 });
  }
  const pwError = validatePasswordStrength(body.password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });

  const passwordHash = await hashPassword(body.password);
  const { user } = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash, role, mustChangePassword: true },
      include: { _count: { select: { importLogs: true, snapshots: true } } },
    });
    const ws = await createWorkspaceForUser(tx, created.id, created.name);
    await createEntitlementForUser(tx, created.id, ws.id);
    return { user: created };
  });

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_user_create',
    eventDescription: `${session.email} created user ${email} with role ${roleLabel(role)}.`,
  });
  await pushUsersToCloudIfConfigured();

  // Send welcome email to the new user.
  let emailSent = false;
  let emailError: string | undefined;
  try {
    invalidateConfig();          // always read fresh env/cloud merge, not stale cache
    const { appUrl } = await getAppConfig();
    const welcome = buildWelcomeEmail(user.name, user.email, body.password!, appUrl);
    emailSent = await sendEmail({ to: user.email, toName: user.name, ...welcome });
    if (!emailSent) {
      emailError = 'No email provider is configured (no Resend API key and no SMTP host/username/password set).';
    }
  } catch (err) {
    // Distinguish "not configured" (sendEmail returns false) from a genuine send failure
    // (Resend/SMTP rejected it) so the admin sees the real cause, not a generic guess.
    const { smtp } = await getAppConfig();
    emailError = process.env.RESEND_API_KEY
      ? `Resend failed: ${err instanceof Error ? err.message : String(err)}`
      : describeSmtpError(err, smtp);
    console.warn('[email] Failed to send welcome email:', err);
  }

  if (emailError) {
    await safeAuditEvent({
      userId: session.userId,
      eventType: 'admin_user_welcome_email_failed',
      eventDescription: `Welcome email failed for ${email}: ${emailError}`,
    });
  }

  await safeNotifications([{
    recipientUserId: session.userId,
    type: 'user_created',
    title: '✅ User account created',
    message: emailSent
      ? `${name} (${email}) was created as ${roleLabel(role)}. A welcome email with their temporary password has been sent.`
      : `${name} (${email}) was created as ${roleLabel(role)}. Welcome email could not be sent — ${emailError}`,
    relatedEntityType: 'User',
    relatedEntityId: user.id,
  }], 'admin_user_create notification');

  return NextResponse.json({ ok: true, emailSent, emailError, user: safeUser(user) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  await syncUsersFromCloudIfConfigured();

  let body: { id?: string; name?: string; role?: AppRole; isActive?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
  if (body.role && !ASSIGNABLE_ROLES.includes(body.role)) {
    return NextResponse.json({ error: 'Unsupported role.' }, { status: 400 });
  }
  if (body.id === session.userId && body.isActive === false) {
    return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: body.id }, select: { id: true, isSuperAdmin: true } });
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (isProtectedFromActor(target, session.userId, body.id)) {
    return NextResponse.json({ error: 'Super admin accounts can only be modified by themselves.' }, { status: 403 });
  }

  const data: { name?: string; role?: AppRole; isActive?: boolean } = {};
  if (body.name?.trim()) data.name = body.name.trim();
  if (body.role) data.role = body.role;
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

  const user = await prisma.user.update({
    where: { id: body.id },
    data,
    include: { _count: { select: { importLogs: true, snapshots: true } } },
  });

  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_user_update',
    eventDescription: `${session.email} updated user ${user.email}.`,
  });
  await pushUsersToCloudIfConfigured();

  return NextResponse.json({ ok: true, user: safeUser(user) });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;
  await syncUsersFromCloudIfConfigured();

  let body: { id?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
  if (body.id === session.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: body.id },
    select: { id: true, name: true, email: true, isSuperAdmin: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (isProtectedFromActor(user, session.userId, body.id)) {
    return NextResponse.json({ error: 'Super admin accounts cannot be deleted.' }, { status: 403 });
  }

  // Cancel any pending add-requests for the deleted user's email so the email
  // can be re-used and the requests list stays clean.
  await prisma.userAddRequest.updateMany({
    where: { requestedEmail: user.email, status: 'pending' },
    data:  { status: 'cancelled', adminDecisionNote: 'User account deleted.' },
  });

  await prisma.user.delete({ where: { id: user.id } });
  await safeAuditEvent({
    userId: session.userId,
    eventType: 'admin_user_delete',
    eventDescription: `${session.email} deleted user ${user.email}.`,
  });
  await pushUsersToCloudIfConfigured();

  return NextResponse.json({ ok: true, deletedUserId: user.id });
}

export const dynamic = 'force-dynamic';
