// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// PATCH /api/notifications/:id/read — marks a notification as read for the current user.
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const notification = await prisma.notification.findUnique({
    where: { id: (await params).id },
  });

  if (!notification || notification.recipientUserId !== session.userId) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  await prisma.notification.update({
    where: { id: (await params).id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
