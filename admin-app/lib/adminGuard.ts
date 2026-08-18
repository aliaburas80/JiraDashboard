import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getIronSession, type IronSession } from 'iron-session';
import { findAdminIdentityById } from '../../src/server/tenancy/adminIdentityRepository';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from './session';

export async function requirePasswordVerifiedAdmin(): Promise<
  | {
      session: IronSession<AdminSessionData>;
      admin: NonNullable<Awaited<ReturnType<typeof findAdminIdentityById>>>;
    }
  | NextResponse
> {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!session.userId || !session.passwordVerified) {
    return NextResponse.json({ error: 'Administrator password verification required.' }, { status: 401 });
  }

  const admin = await findAdminIdentityById(session.userId);
  if (!admin || !admin.isActive || admin.role !== 'admin') {
    session.destroy();
    return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  }

  return { session, admin };
}

export async function completeAdminMfaSession(session: IronSession<AdminSessionData>): Promise<void> {
  session.passwordVerified = true;
  session.mfaVerified = true;
  session.mfaEnrollmentRequired = false;
  session.isLoggedIn = true;
  await session.save();
}
