// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/auth/forgot-password — EP-013. Public, rate-limited 5/IP/hour.
// Always returns the same generic response regardless of whether the email exists,
// to prevent email enumeration — identical pattern to POST /api/auth/register.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVerificationToken, PASSWORD_RESET_TTL_HOURS } from '@/lib/auth';
import { sendEmail, buildPasswordResetEmail } from '@/lib/email';
import { resolveRequestOrigin } from '@/lib/url';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { getRequestId } from '@/lib/requestId';

export const dynamic = 'force-dynamic';

const GENERIC_RESPONSE = { ok: true, message: 'If an account exists for that email, a reset link has been sent.' };

async function checkRateLimit(ip: string): Promise<boolean> {
  const key         = `fp:${ip}`;
  const WINDOW_MS   = 60 * 60_000; // 1 hour
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
      { error: 'Too many password reset requests from this location. Try again in an hour.' },
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
  if (!user || !user.isActive) {
    // Same response as success — do not reveal whether the account exists.
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const token     = generateVerificationToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_HOURS * 60 * 60_000);

  await prisma.user.update({
    where: { id: user.id },
    data:  { passwordResetToken: token, passwordResetExpires: expiresAt },
  });

  try {
    const appUrl       = resolveRequestOrigin(req);
    const emailContent = buildPasswordResetEmail(user.name, token, appUrl);
    await sendEmail({ to: user.email, toName: user.name, ...emailContent });
  } catch (err) {
    await safeAuditEvent({
      userId:           user.id,
      eventType:        'forgot_password_email_failed',
      eventDescription: `Password reset email failed to send for ${email}: ${err instanceof Error ? err.message : String(err)}`,
      ipAddress:        ip,
      correlationId:    getRequestId(req),
    });
  }

  await safeAuditEvent({
    userId:           user.id,
    eventType:        'forgot_password_requested',
    eventDescription: `Password reset requested for ${email}`,
    ipAddress:        ip,
    correlationId:    getRequestId(req),
  });

  return NextResponse.json(GENERIC_RESPONSE);
}
