// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/members — authenticated team member directory.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { isAppRole, roleLabel } from '@/lib/roles';

async function syncUsersFromCloudIfConfigured(): Promise<void> {
  try {
    const { syncFromCloud } = await import('@/services/storage/cloudSync');
    await syncFromCloud();
  } catch {
    // Member directory can continue against the local DB if cloud is temporarily unreachable.
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  await syncUsersFromCloudIfConfigured();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      position: true,
      phone: true,
      contactEmail: true,
      address: true,
      certificates: true,
      bio: true,
    },
  });

  return NextResponse.json({
    members: users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: isAppRole(user.role) ? user.role : 'user',
      roleLabel: roleLabel(user.role),
      avatarUrl: user.avatarUrl ?? '',
      position: user.position ?? '',
      phone: user.phone ?? '',
      contactEmail: user.contactEmail ?? '',
      address: user.address ?? '',
      certificates: user.certificates ?? '',
      bio: user.bio ?? '',
    })),
  });
}

export const dynamic = 'force-dynamic';
