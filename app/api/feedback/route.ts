// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/feedback — capture structured user feedback (P0B-09).
// Auth optional — feedback accepted from logged-in and anonymous users.
// Rate-limited: 10 submissions per IP per 15 minutes.
// Never attaches uploaded Jira data (master plan §4.6).

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { sendEmail, buildFeedbackNotificationEmail, buildFeedbackReceivedEmail } from '@/lib/email';
import { resolveRequestOrigin } from '@/lib/url';
import packageJson from '../../../package.json';

export const dynamic = 'force-dynamic';

// Inbox that receives new-feedback notifications. Configurable, with the
// support address as the documented default.
const FEEDBACK_NOTIFICATION_TO = process.env.FEEDBACK_NOTIFICATION_TO ?? 'support@deliveryclarity.app';

const VALID_CATEGORIES = [
  'Suggestion',
  'Problem/Bug',
  'Feature Request',
  'Complaint',
  'Question',
  'Data/Calculation Concern',
  'Other',
] as const;

const VALID_IMPACTS = ['Minor', 'Affects My Work', 'Blocks Me'] as const;

// P0B-09: ~2MB of base64 comfortably covers a reduced-scale (0.6x), moderate-
// quality (0.6) JPEG capture of a typical page — generous for the intended
// use, small enough not to be a payload-abuse vector on an already
// rate-limited (10/IP/15min) endpoint.
const MAX_SCREENSHOT_LENGTH = 2 * 1024 * 1024;

async function isFeedbackRateLimited(ip: string): Promise<boolean> {
  const key         = `fb:${ip}`;
  const WINDOW_MS   = 15 * 60_000;
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const prunePoint  = new Date(Date.now() - 60 * 60_000);

  const [count] = await Promise.all([
    prisma.loginAttempt.count({ where: { ip: key, attemptedAt: { gte: windowStart } } }),
    prisma.loginAttempt.deleteMany({ where: { ip: key, attemptedAt: { lt: prunePoint } } }),
  ]);

  if (count >= 10) return true;
  await prisma.loginAttempt.create({ data: { ip: key } });
  return false;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  if (await isFeedbackRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many feedback submissions. Try again later.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  const category    = String(body.category ?? '');
  const message     = String(body.message  ?? '').trim().slice(0, 2000);
  const impactLevel = String(body.impactLevel ?? 'Minor');
  const canContact  = body.canContact === true;
  const page        = String(body.page ?? '').slice(0, 200) || undefined;
  const browserFamily = String(body.browserFamily ?? '').slice(0, 50) || undefined;

  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
  }
  if (!VALID_IMPACTS.includes(impactLevel as typeof VALID_IMPACTS[number])) {
    return NextResponse.json({ error: 'Invalid impact level.' }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: 'Feedback message is too short.' }, { status: 400 });
  }

  // P0B-09: optional, user-initiated screenshot — rejected outright (never
  // silently truncated/dropped) if present but malformed or oversized.
  let screenshotData: string | undefined;
  if (body.screenshot !== undefined) {
    const screenshot = String(body.screenshot);
    if (!screenshot.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid screenshot data.' }, { status: 400 });
    }
    if (screenshot.length > MAX_SCREENSHOT_LENGTH) {
      return NextResponse.json({ error: 'Screenshot is too large.' }, { status: 400 });
    }
    screenshotData = screenshot;
  }

  // Resolve session — best effort.
  let userId: string | undefined;
  let userEmail: string | undefined;
  let userName: string | undefined;
  try {
    const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
    if (session.isLoggedIn) {
      userId    = session.userId;
      userEmail = canContact ? session.email : undefined;
      userName  = canContact ? session.name : undefined;
    }
  } catch { /* session unavailable */ }

  await prisma.feedback.create({
    data: {
      category,
      message,
      impactLevel,
      canContact,
      page,
      browserFamily,
      appVersion: packageJson.version,
      userId,
      userEmail,
      status: 'New',
      screenshotData,
    },
  });

  // Best-effort notification — the feedback is already durably stored above,
  // so a failed send here must never fail the submission itself.
  try {
    const emailContent = buildFeedbackNotificationEmail({
      category,
      message,
      impactLevel,
      page,
      browserFamily,
      userEmail,
      submittedAt: new Date().toISOString(),
    });
    await sendEmail({ to: FEEDBACK_NOTIFICATION_TO, ...emailContent });
  } catch (err) {
    console.error('[feedback] Failed to send feedback notification email:', err);
  }

  if (userEmail) {
    try {
      const feedbackSummary = message.length > 240 ? `${message.slice(0, 237)}...` : message;
      const appUrl = resolveRequestOrigin(req);
      const emailContent = buildFeedbackReceivedEmail({
        userName: userName ?? 'there',
        appUrl,
        feedbackSummary,
      });
      await sendEmail({ to: userEmail, toName: userName, ...emailContent });
    } catch (err) {
      console.error('[feedback] Failed to send feedback receipt email:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
