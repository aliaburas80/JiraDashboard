import { NextRequest, NextResponse } from 'next/server';
import { completeAdminMfaSession, requirePasswordVerifiedAdmin } from '../../../../../lib/adminGuard';
import { isAdminMfaRateLimited, safeAdminAudit } from '../../../../../lib/auth';
import { confirmAdminMfaEnrollment } from '../../../../../lib/mfaStore';

export async function POST(req: NextRequest) {
  const guard = await requirePasswordVerifiedAdmin();
  if (guard instanceof NextResponse) return guard;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (await isAdminMfaRateLimited(guard.admin.id, ip)) {
    return NextResponse.json({ error: 'Too many MFA attempts. Try again shortly.' }, { status: 429 });
  }

  let body: { code?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  if (typeof body.code !== 'string') {
    return NextResponse.json({ error: 'Authentication code is required.' }, { status: 400 });
  }

  const result = await confirmAdminMfaEnrollment(guard.admin.id, body.code);
  if (!result.ok || !result.recoveryCodes) {
    return NextResponse.json({ error: 'The authentication code is invalid or expired.' }, { status: 400 });
  }

  await completeAdminMfaSession(guard.session);
  await Promise.all([
    safeAdminAudit({
      organizationId: guard.admin.organizationId,
      userId: guard.admin.id,
      eventType: 'admin_mfa_enabled',
      eventDescription: `${guard.admin.email} enabled TOTP MFA for the separate admin console.`,
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') ?? undefined,
    }),
    safeAdminAudit({
      organizationId: guard.admin.organizationId,
      userId: guard.admin.id,
      eventType: 'admin_console_login',
      eventDescription: `${guard.admin.email} signed in to the separate admin console with MFA.`,
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') ?? undefined,
    }),
  ]);

  return NextResponse.json({ ok: true, recoveryCodes: result.recoveryCodes });
}

export const dynamic = 'force-dynamic';
