// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// GET /api/auth/me — returns current session user data.

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const res     = new NextResponse();
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  return NextResponse.json({
    userId: session.userId,
    email:  session.email,
    name:   session.name,
    role:   session.role,
  });
}
