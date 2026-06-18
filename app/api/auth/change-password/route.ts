// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// POST /api/auth/change-password — authenticated password change.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength, verifyPassword } from '@/lib/auth';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? '';
  const newPassword = body.newPassword ?? '';
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current password and new password are required.' }, { status: 400 });
  }

  const pwError = validatePasswordStrength(newPassword);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'New password must be different from the temporary password.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Account is not available.' }, { status: 403 });
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
    },
  });

  await prisma.auditEvent.create({ data: {
    userId: user.id,
    eventType: 'password_change',
    eventDescription: `${user.email} changed password.`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  }});

  session.mustChangePassword = false;
  await session.save();

  try {
    const { pushToCloud } = await import('@/services/storage/cloudSync');
    await pushToCloud();
  } catch {
    // Local password change must not fail just because cloud backup is unreachable.
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
