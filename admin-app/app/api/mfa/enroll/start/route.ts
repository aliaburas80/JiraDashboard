import { NextResponse } from 'next/server';
import { requirePasswordVerifiedAdmin } from '../../../../../lib/adminGuard';
import { beginAdminMfaEnrollment } from '../../../../../lib/mfaStore';

export async function POST() {
  const guard = await requirePasswordVerifiedAdmin();
  if (guard instanceof NextResponse) return guard;

  const enrollment = await beginAdminMfaEnrollment(guard.admin.id, guard.admin.email);
  if (enrollment.alreadyEnabled) {
    return NextResponse.json({ error: 'MFA is already enabled for this administrator.' }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    secret: enrollment.secret,
    otpAuthUri: enrollment.otpAuthUri,
  });
}

export const dynamic = 'force-dynamic';
