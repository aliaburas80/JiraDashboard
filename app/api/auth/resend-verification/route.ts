// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/auth/resend-verification — sends a fresh EP-012 verification link.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EMAIL_VERIFICATION_TTL_HOURS, generateVerificationToken } from '@/lib/auth';
import { sendEmail, buildVerificationEmail } from '@/lib/email';
import { resolveRequestOrigin } from '@/lib/url';
import { safeAuditEvent } from '@/lib/system-error-logger';

export const dynamic = 'force-dynamic';

const GENERIC_RESPONSE = { ok: true, message: 'If this email needs verification, a new verification link has been sent.' };

async function checkRateLimit(ip: string): Promise<boolean> {
  const key         = `rv:${ip}`;
  const WINDOW_MS   = 60 * 60_000;
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const prunePoint  = new Date(Date.now() - 2 * 60 * 60_000);

  const [count] = await Promise.all([
    prisma.loginAttempt.count({ where: { ip: key, attemptedAt: { gte: windowStart } } }),
    prisma.loginAttempt.deleteMany({ where: { ip: key, attemptedAt: { lt: prunePoint } } }),
  ]);

  if (count >= 5) return true;
  await prisma.loginAttempt.create({ data: { ip: key } });
  return false;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  if (await checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many verification email requests from this location. Try again in an hour.' },
      { status: 429 },
    );
  }

  let body: { email?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim().slice(0, 254) : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || user.emailVerified) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60_000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken:   token,
      emailVerificationExpires: expiresAt,
    },
  });

  try {
    const appUrl = resolveRequestOrigin(req);
    const emailContent = buildVerificationEmail(user.name, user.email, token, appUrl);
    const sent = await sendEmail({ to: user.email, toName: user.name, ...emailContent });
    if (!sent) {
      return NextResponse.json(
        { error: 'We could not send the verification email right now. Please contact your administrator.' },
        { status: 503 },
      );
    }
  } catch (err) {
    await safeAuditEvent({
      userId:           user.id,
      eventType:        'verification_email_resend_failed',
      eventDescription: `Verification email resend failed for ${email}: ${err instanceof Error ? err.message : String(err)}`,
      ipAddress:        ip,
    });
    return NextResponse.json(
      { error: 'Something went wrong sending the verification email. Please try again.' },
      { status: 502 },
    );
  }

  await safeAuditEvent({
    userId:           user.id,
    eventType:        'verification_email_resent',
    eventDescription: `Verification email resent for ${email}`,
    ipAddress:        ip,
  });

  return NextResponse.json({ ok: true, message: 'Verification email sent. Check your inbox and spam folder.' });
}
