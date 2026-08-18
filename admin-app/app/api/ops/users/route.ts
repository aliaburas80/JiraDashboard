import { NextRequest, NextResponse } from 'next/server';
import { requireFullyAuthenticatedAdmin } from '../../../../lib/adminGuard';
import { hashPassword, validatePasswordStrength } from '../../../../../src/lib/auth';
import { ASSIGNABLE_ROLES, isAppRole, roleLabel, type AppRole } from '../../../../../src/lib/roles';
import {
  createOrganizationAuditEvent,
  createOrganizationUser,
  deleteOrganizationUser,
  findOrganizationUserById,
  findUserByEmail,
  listOrganizationUsers,
  updateOrganizationUser,
} from '../../../../../src/server/tenancy/adminOperationalRepository';

function safeUser(user: any) {
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

function requestMeta(req: NextRequest) {
  return {
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  };
}

export async function GET() {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  const users = await listOrganizationUsers(guard.admin.organizationId);
  return NextResponse.json({
    users: users.map(safeUser),
    meId: guard.admin.id,
    roles: ASSIGNABLE_ROLES.map(id => ({ id, label: roleLabel(id) })),
  });
}

export async function POST(req: NextRequest) {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  let body: { name?: string; email?: string; password?: string; role?: AppRole };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const role = body.role;
  if (!name || !email || !body.password || !role) {
    return NextResponse.json({ error: 'Name, email, password, and role are required.' }, { status: 400 });
  }
  if (!ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Unsupported role.' }, { status: 400 });
  }
  const passwordError = validatePasswordStrength(body.password);
  if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const user = await createOrganizationUser(guard.admin.organizationId, {
    name,
    email,
    passwordHash: await hashPassword(body.password),
    role,
  });

  await createOrganizationAuditEvent({
    organizationId: guard.admin.organizationId,
    userId: guard.admin.id,
    eventType: 'admin_user_create',
    eventDescription: `${guard.admin.email} created ${email} as ${roleLabel(role)} from the separate Admin console.`,
    ...requestMeta(req),
  });

  return NextResponse.json({ ok: true, user: safeUser(user) }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  let body: { id?: string; name?: string; role?: AppRole; isActive?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!body.id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
  if (body.id === guard.admin.id && body.isActive === false) {
    return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 });
  }
  if (body.role && !ASSIGNABLE_ROLES.includes(body.role)) {
    return NextResponse.json({ error: 'Unsupported role.' }, { status: 400 });
  }

  const target = await findOrganizationUserById(guard.admin.organizationId, body.id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (target.isSuperAdmin && target.id !== guard.admin.id) {
    return NextResponse.json({ error: 'Owner Admin accounts can only be modified by themselves.' }, { status: 403 });
  }

  const data: { name?: string; role?: string; isActive?: boolean; deletionRequestedAt?: null } = {};
  if (body.name?.trim()) data.name = body.name.trim();
  if (body.role) data.role = body.role;
  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive;
    if (body.isActive) data.deletionRequestedAt = null;
  }

  const user = await updateOrganizationUser(guard.admin.organizationId, body.id, data);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  await createOrganizationAuditEvent({
    organizationId: guard.admin.organizationId,
    userId: guard.admin.id,
    eventType: 'admin_user_update',
    eventDescription: `${guard.admin.email} updated ${user.email} from the separate Admin console.`,
    ...requestMeta(req),
  });
  return NextResponse.json({ ok: true, user: safeUser(user) });
}

export async function DELETE(req: NextRequest) {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.organizationId) {
    return NextResponse.json({ error: 'Administrator organization is not configured.' }, { status: 409 });
  }

  let body: { id?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!body.id) return NextResponse.json({ error: 'User id is required.' }, { status: 400 });
  if (body.id === guard.admin.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  const target = await findOrganizationUserById(guard.admin.organizationId, body.id);
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (target.isSuperAdmin) {
    return NextResponse.json({ error: 'Owner Admin accounts cannot be deleted.' }, { status: 403 });
  }

  const deleted = await deleteOrganizationUser(guard.admin.organizationId, body.id);
  if (!deleted) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  await createOrganizationAuditEvent({
    organizationId: guard.admin.organizationId,
    userId: guard.admin.id,
    eventType: 'admin_user_delete',
    eventDescription: `${guard.admin.email} deleted ${deleted.email} from the separate Admin console.`,
    ...requestMeta(req),
  });
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
