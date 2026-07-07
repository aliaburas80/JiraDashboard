// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/auth/reset-password — EP-013. Consumes the token emailed by
// POST /api/auth/forgot-password, sets a new password, and clears the token.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { sendEmail, buildPasswordChangedEmail } from '@/lib/email';
import { resolveRequestOrigin } from '@/lib/url';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { token?: unknown; newPassword?: unknown };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const token       = typeof body.token === 'string' ? body.token.trim() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!token) {
    return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
  }

  const pwError = validatePasswordStrength(newPassword);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });
  if (!user) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has already been used.' },
      { status: 400 },
    );
  }

  if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    return NextResponse.json(
      { error: 'This reset link has expired. Please request a new one.' },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash:         await hashPassword(newPassword),
      passwordResetToken:   null,
      passwordResetExpires: null,
      mustChangePassword:   false,
    },
  });

  await safeAuditEvent({
    userId:           user.id,
    eventType:        'password_reset',
    eventDescription: `Password reset via emailed link for ${user.email}`,
    ipAddress:        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown',
  });

  try {
    const appUrl = resolveRequestOrigin(req);
    const emailContent = buildPasswordChangedEmail(user.name, appUrl);
    await sendEmail({ to: user.email, toName: user.name, ...emailContent });
  } catch (err) {
    console.error('[auth] Failed to send password changed email after reset:', err);
  }

  return NextResponse.json({ ok: true });
}
