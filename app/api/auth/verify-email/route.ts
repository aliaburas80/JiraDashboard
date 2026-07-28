// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/auth/verify-email — EP-012. Consumes the token emailed at registration,
// flips User.emailVerified, and clears the token so it cannot be replayed.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { sendEmail, buildVerificationThankYouEmail } from '@/lib/email';
import { getRequestId } from '@/lib/requestId';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { token?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Verification token is required.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { emailVerificationToken: token } });
  if (!user) {
    return NextResponse.json(
      { error: 'This verification link is invalid or has already been used.' },
      { status: 400 },
    );
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    return NextResponse.json(
      { error: 'This verification link has expired. Please request a new one.' },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified:            true,
      emailVerificationToken:   null,
      emailVerificationExpires: null,
    },
  });

  await safeAuditEvent({
    userId:           user.id,
    eventType:        'email_verified',
    eventDescription: `Email verified for ${user.email}`,
    ipAddress:        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown',
    correlationId:    getRequestId(req),
  });

  // Best-effort — verification already succeeded and was persisted above;
  // a failed thank-you email must never turn that into an error response.
  try {
    const emailContent = buildVerificationThankYouEmail(user.name);
    await sendEmail({ to: user.email, toName: user.name, ...emailContent });
  } catch (err) {
    await safeAuditEvent({
      userId:           user.id,
      eventType:        'verification_thank_you_email_failed',
      eventDescription: `Thank-you email failed to send for ${user.email}: ${err instanceof Error ? err.message : String(err)}`,
      correlationId:    getRequestId(req),
    });
  }

  return NextResponse.json({ ok: true, alreadyVerified: false });
}
