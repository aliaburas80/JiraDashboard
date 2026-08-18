import { NextRequest, NextResponse } from 'next/server';
import { completeAdminMfaSession, requirePasswordVerifiedAdmin } from '../../../../lib/adminGuard';
import { safeAdminAudit } from '../../../../lib/auth';
import { verifyAdminSecondFactor } from '../../../../lib/mfaStore';

export async function POST(req: NextRequest) {
  const guard = await requirePasswordVerifiedAdmin();
  if (guard instanceof NextResponse) return guard;

  let body: { code?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  if (typeof body.code !== 'string') {
    return NextResponse.json({ error: 'Authentication code or recovery code is required.' }, { status: 400 });
  }

  const result = await verifyAdminSecondFactor(guard.admin.id, body.code);
  if (!result.ok) {
    await safeAdminAudit({
      organizationId: guard.admin.organizationId,
      userId: guard.admin.id,
      eventType: 'admin_mfa_failed',
      eventDescription: `${guard.admin.email} submitted an invalid admin-console second factor.`,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
    return NextResponse.json({ error: 'The authentication code is invalid, expired, or already used.' }, { status: 401 });
  }

  await completeAdminMfaSession(guard.session);
  await safeAdminAudit({
    organizationId: guard.admin.organizationId,
    userId: guard.admin.id,
    eventType: 'admin_console_login',
    eventDescription: `${guard.admin.email} signed in to the separate admin console using ${result.method === 'recovery' ? 'a recovery code' : 'TOTP MFA'}.`,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    method: result.method,
    recoveryCodesRemaining: result.recoveryCodesRemaining,
  });
}

export const dynamic = 'force-dynamic';
