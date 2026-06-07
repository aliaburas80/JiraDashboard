// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// GET/PATCH /api/profile — authenticated user profile.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import type { IronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { isAppRole, roleLabel } from '@/lib/roles';

const PROFILE_FIELDS = {
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
  updatedAt: true,
};

function clean(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 2000) : null;
}

function safeProfile(user: any) {
  return {
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
    updatedAt: user.updatedAt?.toISOString?.() ?? null,
  };
}

async function requireUser(): Promise<IronSession<SessionData> | NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  return session;
}

async function syncUsersFromCloudIfConfigured(): Promise<void> {
  try {
    const { syncFromCloud } = await import('@/services/storage/cloudSync');
    await syncFromCloud();
  } catch {
    // Profile can continue against the local DB if cloud is temporarily unreachable.
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await requireUser();
  if (session instanceof NextResponse) return session;
  await syncUsersFromCloudIfConfigured();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: PROFILE_FIELDS,
  });

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  return NextResponse.json({ profile: safeProfile(user) });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await requireUser();
  if (session instanceof NextResponse) return session;
  await syncUsersFromCloudIfConfigured();

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const name = clean(body.name);
  if (typeof name !== 'string') return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

  const data = {
    name,
    avatarUrl: clean(body.avatarUrl),
    position: clean(body.position),
    phone: clean(body.phone),
    contactEmail: clean(body.contactEmail),
    address: clean(body.address),
    certificates: clean(body.certificates),
    bio: clean(body.bio),
  };

  const user = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: PROFILE_FIELDS,
  });

  session.name = user.name;
  await session.save();

  await prisma.auditEvent.create({ data: {
    userId: user.id,
    eventType: 'profile_update',
    eventDescription: `${user.email} updated profile.`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  }}).catch(() => {});

  try {
    const { pushToCloud } = await import('@/services/storage/cloudSync');
    await pushToCloud();
  } catch {
    // Profile update succeeded locally; cloud sync can retry later.
  }

  return NextResponse.json({ ok: true, profile: safeProfile(user) });
}

export const dynamic = 'force-dynamic';
