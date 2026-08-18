import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { safeAdminAudit } from '../../../../lib/auth';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../../../lib/session';

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  const userId = session.userId;
  const email = session.email;
  session.destroy();

  if (userId) {
    await safeAdminAudit({
      userId,
      eventType: 'admin_console_logout',
      eventDescription: `${email || userId} signed out of the separate admin console.`,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
