import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { findAdminIdentityById } from '../../../../../src/server/tenancy/adminIdentityRepository';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../../../lib/session';

export async function GET() {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const user = await findAdminIdentityById(session.userId);

  if (!user || !user.isActive || user.role !== 'admin') {
    session.destroy();
    return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  }

  return NextResponse.json({
    admin: {
      id: user.id,
      name: user.name,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    },
  });
}

export const dynamic = 'force-dynamic';
