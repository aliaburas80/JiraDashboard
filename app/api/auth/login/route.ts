// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// POST /api/auth/login — validates credentials, sets iron-session cookie.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { isAppRole } from '@/lib/roles';

function loginError(
  status: number,
  error: string,
  solution: string,
  details?: string,
): NextResponse {
  return NextResponse.json({ error, solution, details }, { status });
}

// Persistent rate limiter backed by PostgreSQL — survives Render cold starts.
// Returns { limited, retryAfterSeconds } so the 429 response can tell the
// client exactly how long to wait before retrying.
async function checkLoginRateLimit(ip: string): Promise<{ limited: boolean; retryAfterSeconds: number }> {
  const WINDOW_MS  = 60_000;
  const PRUNE_MS   = 10 * 60_000;
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const prunePoint  = new Date(Date.now() - PRUNE_MS);

  const [attempts] = await Promise.all([
    prisma.loginAttempt.findMany({
      where:   { ip, attemptedAt: { gte: windowStart } },
      orderBy: { attemptedAt: 'asc' },
      select:  { attemptedAt: true },
    }),
    prisma.loginAttempt.deleteMany({ where: { attemptedAt: { lt: prunePoint } } }),
  ]);

  if (attempts.length >= 5) {
    // The 1st (oldest) attempt in the window determines when a slot frees up.
    const earliest         = attempts[0].attemptedAt.getTime();
    const retryAfterMs     = (earliest + WINDOW_MS) - Date.now();
    const retryAfterSeconds = Math.ceil(Math.max(retryAfterMs, 1) / 1000);
    return { limited: true, retryAfterSeconds };
  }

  await prisma.loginAttempt.create({ data: { ip } });
  return { limited: false, retryAfterSeconds: 0 };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const { limited, retryAfterSeconds } = await checkLoginRateLimit(ip);
  if (limited) {
    const mins = Math.floor(retryAfterSeconds / 60);
    const secs = retryAfterSeconds % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    return NextResponse.json(
      {
        error:              'Too many login attempts.',
        solution:           `Wait ${timeStr} and try again. If you recently changed your password, use the newest password from your administrator.`,
        retryAfterSeconds,
      },
      {
        status:  429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      },
    );
  }

  let dataSource: unknown = null;
  try {
    const { syncFromCloud } = await import('@/services/storage/cloudSync');
    dataSource = await syncFromCloud();
  } catch (error) {
    dataSource = {
      status: 'fallback',
      source: 'local',
      error: error instanceof Error ? error.message : String(error),
      reason: 'Bucket sync failed before login; using local server database.',
    };
  }

  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch {
    return loginError(
      400,
      'Invalid login request.',
      'Refresh the page and try signing in again.',
      'The browser sent a request the server could not read as JSON.',
    );
  }

  const { email, password } = body;
  if (!email || !password) {
    return loginError(
      400,
      'Email and password are required.',
      'Enter both your email address and password, then click Sign in again.',
    );
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    const GENERIC = 'Invalid email or password.';

    if (!user) {
      return loginError(
        401,
        GENERIC,
        'Check the email spelling and password. If this is a new account, use the temporary password from your welcome email. If you still cannot sign in, ask an admin to reset your password.',
      );
    }
    if (!user.isActive) {
      return loginError(
        403,
        'Account is disabled.',
        'Contact your administrator and ask them to reactivate your account in Admin > Users.',
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return loginError(
        401,
        GENERIC,
        'Check for typos, Caps Lock, or an old temporary password. If you were just added by an admin, copy the temporary password exactly from the welcome email.',
      );
    }

    // Use cookies() from next/headers — correct App Router approach for iron-session v8
    const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
    session.userId     = user.id;
    session.email      = user.email;
    session.name       = user.name;
    session.role       = isAppRole(user.role) ? user.role : 'user';
    session.mustChangePassword = user.mustChangePassword;
    session.isLoggedIn = true;
    await session.save();

    await Promise.all([
      prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      prisma.auditEvent.create({ data: {
        userId: user.id, eventType: 'login',
        eventDescription: `${user.email} logged in.`,
        ipAddress: ip, userAgent: req.headers.get('user-agent') ?? undefined,
      }}),
    ]);

    return NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword },
      mustChangePassword: user.mustChangePassword,
      dataSource,
    });
  } catch (error) {
    return loginError(
      500,
      'Sign in failed because the server could not finish the login check.',
      'Try again. If this keeps happening, ask an admin to check the database and server logs.',
      process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'LOGIN_SERVER_ERROR',
    );
  }
}
