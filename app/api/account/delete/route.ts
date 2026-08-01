// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/account/delete — P0B-04: self-service account deletion request.
// Password-verified, immediately locks the account out (isActive: false),
// destroys the current session. The row itself is hard-deleted later by a
// scheduled job once the grace period elapses (see scripts/purge-expired-data.mjs).

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { requestAccountDeletion } from '@/lib/accountLifecycle';

export const dynamic = 'force-dynamic';

// Rate limit: 10 attempts per user per 15 minutes — same bar as change-password
// (GAP-2, P0A-05), since this endpoint also re-verifies a password behind an
// active session.
async function checkDeleteRateLimit(userId: string): Promise<{ limited: boolean; retryAfterSeconds: number }> {
  const key         = `del:${userId}`;
  const WINDOW_MS   = 15 * 60_000;
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const prunePoint  = new Date(Date.now() - 60 * 60_000);
  const [attempts] = await Promise.all([
    prisma.loginAttempt.findMany({
      where:   { ip: key, attemptedAt: { gte: windowStart } },
      orderBy: { attemptedAt: 'asc' },
      select:  { attemptedAt: true },
    }),
    prisma.loginAttempt.deleteMany({ where: { ip: key, attemptedAt: { lt: prunePoint } } }),
  ]);
  if (attempts.length >= 10) {
    const earliest          = attempts[0].attemptedAt.getTime();
    const retryAfterSeconds = Math.ceil(Math.max((earliest + WINDOW_MS) - Date.now(), 1) / 1000);
    return { limited: true, retryAfterSeconds };
  }
  await prisma.loginAttempt.create({ data: { ip: key } });
  return { limited: false, retryAfterSeconds: 0 };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { limited, retryAfterSeconds } = await checkDeleteRateLimit(session.userId);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait before trying again.', retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
  }

  let body: { password?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const password = body.password ?? '';
  if (!password) {
    return NextResponse.json({ error: 'Password is required to confirm account deletion.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Account is not available.' }, { status: 403 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  await requestAccountDeletion(user.id);

  // The row still exists at write time (the grace-period purge job runs
  // later), so this event keeps a real userId — unlike the eventual hard
  // delete, which will SetNull it via the FK, this one stays joinable in
  // the interim.
  await prisma.auditEvent.create({ data: {
    userId:           user.id,
    eventType:        'account_deletion_requested',
    eventDescription: `${user.email} requested account deletion. Scheduled for permanent removal after the grace period.`,
    ipAddress:        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent:        req.headers.get('user-agent') ?? undefined,
  }}).catch(() => {});

  session.destroy();

  return NextResponse.json({ ok: true });
}
