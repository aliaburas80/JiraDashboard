// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/events/error — receive a client-side error report from the browser.
//
// Public endpoint (no auth required — errors can occur before/during login).
// Rate limited: 30 reports per IP per 15 minutes to prevent abuse.
// Errors are de-duplicated by fingerprint (sha256 of message+page+component):
// new occurrences of the same error increment count and update lastSeenAt
// instead of creating duplicate rows.
//
// Stack traces are sanitised before storage — absolute file paths stripped.
// Never stores cookies, tokens, form values, or uploaded Jira content.

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import packageJson from '../../../../package.json';

export const dynamic = 'force-dynamic';

// ── Rate limit ────────────────────────────────────────────────────────────────

async function isErrorRateLimited(ip: string): Promise<boolean> {
  const key         = `er:${ip}`;
  const WINDOW_MS   = 15 * 60_000;
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const prunePoint  = new Date(Date.now() - 60 * 60_000);

  const [count] = await Promise.all([
    prisma.loginAttempt.count({ where: { ip: key, attemptedAt: { gte: windowStart } } }),
    prisma.loginAttempt.deleteMany({ where: { ip: key, attemptedAt: { lt: prunePoint } } }),
  ]);

  if (count >= 30) return true;
  await prisma.loginAttempt.create({ data: { ip: key } });
  return false;
}

// ── Stack sanitisation ────────────────────────────────────────────────────────

function sanitiseStack(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw
    .split('\n')
    .slice(0, 20)                                    // cap at 20 frames
    .map(line => line
      .replace(/file:\/\/[^\s)]+/g, '<file>')        // absolute file: URLs
      .replace(/\/Users\/[^\s/)]+/g, '/~')           // macOS home paths
      .replace(/\/home\/[^\s/)]+/g, '/~')            // Linux home paths
      .replace(/[A-Z]:\\[^\s)]+/g, '<path>'),        // Windows paths
    )
    .join('\n');
}

// ── Fingerprint ───────────────────────────────────────────────────────────────

function makeFingerprint(message: string, page: string, component: string): string {
  return createHash('sha256')
    .update(`${message}|${page}|${component}`)
    .digest('hex')
    .slice(0, 32);
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  if (await isErrorRateLimited(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 }); }

  const message   = String(body.message ?? '').slice(0, 500);
  const page      = String(body.page      ?? '').slice(0, 200);
  const component = String(body.component ?? '').slice(0, 100);
  const severity  = ['error', 'warning', 'critical'].includes(String(body.severity))
    ? String(body.severity) : 'error';
  const stack     = sanitiseStack(typeof body.stack === 'string' ? body.stack : undefined);
  const browserFamily = String(body.browserFamily ?? '').slice(0, 50) || undefined;

  if (!message) {
    return NextResponse.json({ ok: false, reason: 'missing_message' }, { status: 400 });
  }

  // Resolve session userId — best-effort, not required.
  let userId: string | undefined;
  try {
    const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
    if (session.isLoggedIn) userId = session.userId;
  } catch { /* ignore — session unavailable is fine */ }

  const fingerprint = makeFingerprint(message, page, component);
  const now         = new Date();

  try {
    const existing = await prisma.appError.findFirst({ where: { fingerprint } });

    if (existing) {
      await prisma.appError.update({
        where: { id: existing.id },
        data:  { count: { increment: 1 }, lastSeenAt: now },
      });
    } else {
      await prisma.appError.create({
        data: {
          fingerprint,
          message,
          stack,
          severity,
          page:           page || undefined,
          component:      component || undefined,
          userId,
          browserFamily,
          releaseVersion: packageJson.version,
          firstSeenAt:    now,
          lastSeenAt:     now,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Never surface DB errors to the client — just acknowledge silently.
    return NextResponse.json({ ok: true });
  }
}
