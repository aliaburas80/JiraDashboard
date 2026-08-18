import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { isAdminLoginRateLimited, safeAdminAudit, verifyAdminCredentials } from '../../../../lib/auth';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../../../lib/session';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  if (await isAdminLoginRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many login attempts. Try again shortly.' }, { status: 429 });
  }

  let body: { email?: unknown; password?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const admin = await verifyAdminCredentials(body.email, body.password);
  if (!admin) {
    await safeAdminAudit({
      eventType: 'admin_login_failed',
      eventDescription: `Rejected admin-console login attempt for ${body.email.trim().toLowerCase() || '(blank email)'}.`,
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
    return NextResponse.json({ error: 'Invalid administrator credentials.' }, { status: 401 });
  }

  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  session.userId = admin.id;
  session.email = admin.email;
  session.name = admin.name;
  session.isSuperAdmin = admin.isSuperAdmin;
  session.isLoggedIn = true;
  await session.save();

  await safeAdminAudit({
    organizationId: admin.organizationId,
    userId: admin.id,
    eventType: 'admin_console_login',
    eventDescription: `${admin.email} signed in to the separate admin console.`,
    ipAddress: ip,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    admin: { name: admin.name, email: admin.email, isSuperAdmin: admin.isSuperAdmin },
  });
}

export const dynamic = 'force-dynamic';
