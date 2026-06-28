// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// POST /api/demo-request — public endpoint behind the /promo "Request a demo"
// form. A visitor supplies who they are, what they need, and why; we email the
// product owner so they can follow up. No authentication (the promo page is
// public and intentionally excluded from middleware), so input is validated
// strictly and submissions are IP rate-limited.

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, buildDemoRequestEmail } from '@/lib/email';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FIELD = 2000;
const MIN_JUSTIFICATION = 20;

// Owner inbox that receives demo requests. Configurable, with the project
// owner's address as the documented default.
const DEMO_REQUEST_TO = process.env.DEMO_REQUEST_TO ?? 'aliaburas80@gmail.com';

// Simple in-process rate limiter — 5 submissions per 15 minutes per IP.
const RATE_WINDOW_MS = 15 * 60_000;
const RATE_MAX = 5;
const SUBMIT_RATE = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (SUBMIT_RATE.get(ip) ?? []).filter(t => t > now - RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) return true;
  SUBMIT_RATE.set(ip, [...hits, now]);
  return false;
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_FIELD) : '';
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes before trying again.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const organization = clean(body.organization);
  const role = clean(body.role);
  const need = clean(body.need);
  const justification = clean(body.justification);

  if (!name || !email || !organization || !role || !need || !justification) {
    return NextResponse.json(
      { error: 'All fields are required so we can route your request to the right person.' },
      { status: 400 },
    );
  }

  if (!EMAIL_FORMAT.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid work email address.' }, { status: 400 });
  }

  if (justification.length < MIN_JUSTIFICATION) {
    return NextResponse.json(
      { error: 'Please tell us a little more about why you would like a demo (at least 20 characters).' },
      { status: 400 },
    );
  }

  const email_ = buildDemoRequestEmail({
    name,
    email,
    organization,
    role,
    need,
    justification,
    submittedAt: new Date().toISOString(),
  });

  try {
    const sent = await sendEmail({ to: DEMO_REQUEST_TO, ...email_ });
    if (!sent) {
      // SMTP not configured — record it so the request is not silently lost.
      console.warn(`[demo-request] SMTP unavailable — unsent request from ${email} (${organization}).`);
      return NextResponse.json(
        { error: 'We could not send your request right now. Please email aliaburas80@gmail.com directly.' },
        { status: 503 },
      );
    }
  } catch (err) {
    console.error('[demo-request] Failed to send demo request email:', err);
    return NextResponse.json(
      { error: 'Something went wrong sending your request. Please email aliaburas80@gmail.com directly.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export const dynamic = 'force-dynamic';
