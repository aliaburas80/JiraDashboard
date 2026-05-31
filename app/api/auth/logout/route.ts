// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// POST /api/auth/logout — clears session cookie.

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const res     = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);

  if (session.isLoggedIn && session.userId) {
    await prisma.auditEvent.create({ data: {
      userId: session.userId, eventType: 'logout',
      eventDescription: `${session.email} logged out.`,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    }}).catch(() => {});
  }

  session.destroy();
  return res;
}
