// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// GET /api/auth/me — returns current session user data.
// EP-010: verifies isActive in DB so suspended users are ejected immediately
// on their next request rather than waiting for cookie expiry.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  // EP-010: DB check — if the account has been suspended since the cookie was issued,
  // destroy the session and return 401 so the UI redirects to login immediately.
  try {
    const user = await prisma.user.findUnique({
      where:  { id: session.userId },
      select: { isActive: true, role: true, mustChangePassword: true, emailVerified: true },
    });
    if (!user || !user.isActive) {
      session.destroy();
      return NextResponse.json({ error: 'Account is suspended or no longer exists.' }, { status: 401 });
    }
    // Verification happens via a token link, not a session — a user who
    // verifies from a different browser/tab than the one they're logged in
    // on would otherwise carry a stale session.emailVerified: false until
    // their next login. Sync it here so the UI's "please verify" reminder
    // clears as soon as they've actually verified, not on next login.
    if (session.emailVerified !== user.emailVerified) {
      session.emailVerified = user.emailVerified;
      await session.save();
    }
  } catch {
    // DB temporarily unavailable — trust the cookie rather than block all users.
  }

  return NextResponse.json({
    userId:             session.userId,
    email:              session.email,
    name:               session.name,
    role:               session.role,
    mustChangePassword: Boolean(session.mustChangePassword),
    emailVerified:      session.emailVerified !== false, // default true for backward compat
    dataStorageMode:    session.dataStorageMode === 'local' ? 'local' : 'cloud',
    isSuperAdmin:       Boolean(session.isSuperAdmin),
  });
}
