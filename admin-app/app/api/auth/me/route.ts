import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '../../../../lib/prisma';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../../../lib/session';

export async function GET() {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true, isSuperAdmin: true },
  });

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
