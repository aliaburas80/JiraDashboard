import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getIronSession, type IronSession } from 'iron-session';
import { findAdminIdentityById } from '../../src/server/tenancy/adminIdentityRepository';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData, isFullyAuthenticatedAdminSession } from './session';

type AdminIdentity = NonNullable<Awaited<ReturnType<typeof findAdminIdentityById>>>;

type GuardResult = {
  session: IronSession<AdminSessionData>;
  admin: AdminIdentity;
};

async function loadActiveAdmin(session: IronSession<AdminSessionData>): Promise<AdminIdentity | NextResponse> {
  if (!session.userId) {
    return NextResponse.json({ error: 'Administrator authentication required.' }, { status: 401 });
  }

  const admin = await findAdminIdentityById(session.userId);
  if (!admin || !admin.isActive || admin.role !== 'admin') {
    session.destroy();
    return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  }

  return admin;
}

export async function requirePasswordVerifiedAdmin(): Promise<GuardResult | NextResponse> {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!session.userId || !session.passwordVerified) {
    return NextResponse.json({ error: 'Administrator password verification required.' }, { status: 401 });
  }

  const admin = await loadActiveAdmin(session);
  if (admin instanceof NextResponse) return admin;
  return { session, admin };
}

export async function requireFullyAuthenticatedAdmin(): Promise<GuardResult | NextResponse> {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!isFullyAuthenticatedAdminSession(session)) {
    return NextResponse.json({ error: 'Administrator MFA authentication required.' }, { status: 401 });
  }

  const admin = await loadActiveAdmin(session);
  if (admin instanceof NextResponse) return admin;
  return { session, admin };
}

export async function requireOwnerAdmin(): Promise<GuardResult | NextResponse> {
  const guard = await requireFullyAuthenticatedAdmin();
  if (guard instanceof NextResponse) return guard;
  if (!guard.admin.isSuperAdmin) {
    return NextResponse.json({ error: 'Owner Admin access required.' }, { status: 403 });
  }
  return guard;
}

export async function completeAdminMfaSession(session: IronSession<AdminSessionData>): Promise<void> {
  session.passwordVerified = true;
  session.mfaVerified = true;
  session.mfaEnrollmentRequired = false;
  session.isLoggedIn = true;
  await session.save();
}
