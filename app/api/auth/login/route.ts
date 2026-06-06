// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// POST /api/auth/login — validates credentials, sets iron-session cookie.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { isAppRole } from '@/lib/roles';

const LOGIN_RATE = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (LOGIN_RATE.get(ip) ?? []).filter(t => t > now - 60_000);
  if (hits.length >= 5) return true;
  LOGIN_RATE.set(ip, [...hits, now]);
  return false;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many login attempts. Wait 1 minute.' }, { status: 429 });
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
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  const GENERIC = 'Invalid email or password.';

  if (!user)          return NextResponse.json({ error: GENERIC }, { status: 401 });
  if (!user.isActive) return NextResponse.json({ error: 'Account is disabled. Contact your administrator.' }, { status: 403 });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return NextResponse.json({ error: GENERIC }, { status: 401 });

  // Use cookies() from next/headers — correct App Router approach for iron-session v8
  const session = await getIronSession<SessionData>(cookies(), SESSION_OPTIONS);
  session.userId     = user.id;
  session.email      = user.email;
  session.name       = user.name;
  session.role       = isAppRole(user.role) ? user.role : 'user';
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

  return NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role }, dataSource });
}
