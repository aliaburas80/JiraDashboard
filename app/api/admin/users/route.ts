// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET/POST/PATCH/DELETE /api/admin/users — admin-only user management.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { sendEmail, buildWelcomeEmail } from '@/lib/email';
import { getAppConfig } from '@/lib/app-config';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { ASSIGNABLE_ROLES, isAppRole, roleLabel, type AppRole } from '@/lib/roles';

async function requireAdmin(): Promise<SessionData | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  return session;
}

function safeUser(user: {
  id: string; name: string; email: string; role: string; isActive: boolean;
  mustChangePassword?: boolean;
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
    mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    importCount: user._count?.importLogs ?? 0,
    snapshotCount: user._count?.snapshots ?? 0,
  };
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

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(body.password), role, mustChangePassword: true },
    include: { _count: { select: { importLogs: true, snapshots: true } } },
  });

  await prisma.auditEvent.create({ data: {
    userId: session.userId,
    eventType: 'admin_user_create',
    eventDescription: `${session.email} created user ${email} with role ${roleLabel(role)}.`,
  }});
  await pushUsersToCloudIfConfigured();

  // Send welcome email to the new user.
  let emailSent = false;
  try {
    const { appUrl } = await getAppConfig();
    const welcome = buildWelcomeEmail(user.name, user.email, body.password!, appUrl);
    emailSent = await sendEmail({ to: user.email, toName: user.name, ...welcome });
  } catch (err) {
    console.warn('[email] Failed to send welcome email:', err);
  }

  // Notify the admin who created the user with the outcome.
  try {
    await prisma.notification.create({
      data: {
        recipientUserId: session.userId,
        type: 'user_created',
        title: '✅ User account created',
        message: emailSent
          ? `${name} (${email}) was created as ${roleLabel(role)}. A welcome email with their temporary password has been sent.`
          : `${name} (${email}) was created as ${roleLabel(role)}. Welcome email could not be sent — configure SMTP in Admin → Settings.`,
        relatedEntityType: 'User',
        relatedEntityId: user.id,
      },
    });
  } catch { /* swallow notification errors */ }

  return NextResponse.json({ ok: true, emailSent, user: safeUser(user) }, { status: 201 });
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

  const data: { name?: string; role?: AppRole; isActive?: boolean } = {};
  if (body.name?.trim()) data.name = body.name.trim();
  if (body.role) data.role = body.role;
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

  const user = await prisma.user.update({
    where: { id: body.id },
    data,
    include: { _count: { select: { importLogs: true, snapshots: true } } },
  });

  await prisma.auditEvent.create({ data: {
    userId: session.userId,
    eventType: 'admin_user_update',
    eventDescription: `${session.email} updated user ${user.email}.`,
  }});
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
    select: { id: true, name: true, email: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  await prisma.user.delete({ where: { id: user.id } });
  await prisma.auditEvent.create({ data: {
    userId: session.userId,
    eventType: 'admin_user_delete',
    eventDescription: `${session.email} deleted user ${user.email}.`,
  }});
  await pushUsersToCloudIfConfigured();

  return NextResponse.json({ ok: true, deletedUserId: user.id });
}

export const dynamic = 'force-dynamic';
