// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// POST /api/auth/register — public self-registration (EP-011).
// Creates user + workspace atomically. Rate-limited 5/IP/hour.
// New users start with emailVerified = false until EP-012 verification link is clicked.
// Sends verification email if email provider is configured; silently skips if not.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength, generateVerificationToken, EMAIL_VERIFICATION_TTL_HOURS } from '@/lib/auth';
import { createWorkspaceForUser } from '@/lib/workspace';
import { safeAuditEvent } from '@/lib/system-error-logger';
import { PERSONAS, CURRENT_TERMS_VERSION, type Persona } from '@/lib/personas';
import { createEntitlementForUser } from '@/lib/entitlement';
import { resolveRequestOrigin } from '@/lib/url';

export const dynamic = 'force-dynamic';

// Rate limiter: 5 registrations per IP per hour using the LoginAttempt table.
async function checkRegistrationRateLimit(ip: string): Promise<boolean> {
  const key         = `reg:${ip}`;
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

  // Rate limit before any DB reads.
  if (await checkRegistrationRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many registration attempts from this location. Try again in an hour.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const name            = String(body.name    ?? '').trim().slice(0, 100);
  const email           = String(body.email   ?? '').toLowerCase().trim().slice(0, 254);
  const password        = String(body.password ?? '');
  const persona         = String(body.persona  ?? '');
  const consentAccepted = body.consentAccepted === true;

  // ── Validation ─────────────────────────────────────────────────────────────

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter your full name (at least 2 characters).' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  const pwError = validatePasswordStrength(password);
  if (pwError) {
    return NextResponse.json({ error: pwError }, { status: 400 });
  }
  if (!PERSONAS.includes(persona as Persona)) {
    return NextResponse.json({ error: 'Please select your primary role.' }, { status: 400 });
  }
  if (!consentAccepted) {
    return NextResponse.json(
      { error: 'You must accept the Terms of Use and Privacy Policy to create an account.' },
      { status: 400 },
    );
  }

  // ── Duplicate email check ───────────────────────────────────────────────────
  // Use a generic message to prevent email enumeration.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Same message as "success" to prevent email enumeration.
    return NextResponse.json({ ok: true, emailVerified: false });
  }

  // ── Create user + workspace atomically ─────────────────────────────────────
  const passwordHash          = await hashPassword(password);
  const verificationToken     = generateVerificationToken();
  const verificationExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60_000);
  const { user } = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role:                     'user',
        emailVerified:            false, // requires EP-012 verification link
        emailVerificationToken:   verificationToken,
        emailVerificationExpires: verificationExpiresAt,
        persona,
        isActive:           true,
        mustChangePassword: false,
        termsAcceptedAt:    new Date(),
        termsVersion:       CURRENT_TERMS_VERSION,
      },
    });
    const ws = await createWorkspaceForUser(tx, created.id, created.name);
    await createEntitlementForUser(tx, created.id, ws.id);
    return { user: created };
  });

  await safeAuditEvent({
    userId:           user.id,
    eventType:        'register',
    eventDescription: `New user registered: ${email} (persona: ${persona})`,
    ipAddress:        ip,
  });

  // ── Verification email ────────────────────────────────────────────────────
  // Registration still succeeds if email sending fails (e.g. no provider configured) —
  // the user can be verified manually by an admin, or the token can be re-sent later.
  try {
    const { sendEmail, buildVerificationEmail } = await import('@/lib/email');
    const appUrl = resolveRequestOrigin(req);
    const emailContent = buildVerificationEmail(user.name, user.email, verificationToken, appUrl);
    await sendEmail({ to: user.email, toName: user.name, ...emailContent });
  } catch (err) {
    await safeAuditEvent({
      userId:           user.id,
      eventType:        'register_verification_email_failed',
      eventDescription: `Verification email failed to send for ${email}: ${err instanceof Error ? err.message : String(err)}`,
      ipAddress:        ip,
    });
  }

  return NextResponse.json({ ok: true, emailVerified: false });
}
