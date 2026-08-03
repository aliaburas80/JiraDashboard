// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/events — receive a batch of product events from the P0B-06
// client queue (src/lib/analytics/eventFlush.ts).
//
// Scope is deliberately minimal: this validates each event's shape and
// taxonomy membership and returns the master plan's {accepted, rejected}
// acknowledgement contract (§4.7) — it does NOT deduplicate or persist
// anything. Real validation depth, deduplication, and durable storage are
// P0B-07's job, to be added behind this same response contract; do not
// assume events reaching this route are stored anywhere.
//
// Public endpoint (no auth) — consent is enforced entirely client-side by
// P0B-05's getAnalyticsConsent() gate before an event is ever produced, the
// same posture as the pre-existing POST /api/events/error.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAnalyticsEventName } from '@/lib/analytics/eventTaxonomy';

export const dynamic = 'force-dynamic';

const MAX_BATCH_SIZE = 50;

// ── Rate limit — same LoginAttempt-table sliding-window pattern as
// app/api/events/error/route.ts, different key prefix. ────────────────────────

async function isEventsRateLimited(ip: string): Promise<boolean> {
  const key         = `ev:${ip}`;
  const WINDOW_MS    = 15 * 60_000;
  const windowStart  = new Date(Date.now() - WINDOW_MS);
  const prunePoint   = new Date(Date.now() - 60 * 60_000);

  const [count] = await Promise.all([
    prisma.loginAttempt.count({ where: { ip: key, attemptedAt: { gte: windowStart } } }),
    prisma.loginAttempt.deleteMany({ where: { ip: key, attemptedAt: { lt: prunePoint } } }),
  ]);

  // Higher than /api/events/error's 30 — a single flush can legitimately
  // carry up to MAX_BATCH_SIZE events, and this endpoint is called far more
  // frequently (every 10s while active) than a one-off error report.
  if (count >= 120) return true;
  await prisma.loginAttempt.create({ data: { ip: key } });
  return false;
}

// ── Per-event validation ─────────────────────────────────────────────────────

function validateEvent(raw: unknown): { event_id: string } | { event_id: string; reason: string } {
  if (typeof raw !== 'object' || raw === null) {
    return { event_id: '', reason: 'not_an_object' };
  }
  const event = raw as Record<string, unknown>;
  const eventId = typeof event.event_id === 'string' ? event.event_id : '';

  if (!eventId) return { event_id: '', reason: 'missing_event_id' };
  if (typeof event.schema_version !== 'number') return { event_id: eventId, reason: 'missing_schema_version' };
  if (typeof event.event_name !== 'string' || !isAnalyticsEventName(event.event_name)) {
    return { event_id: eventId, reason: 'invalid_schema' };
  }
  return { event_id: eventId };
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';

  if (await isEventsRateLimited(ip)) {
    return NextResponse.json({ accepted: [], rejected: [] }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }

  if (!Array.isArray(body.events)) {
    return NextResponse.json({ error: '"events" must be an array.' }, { status: 400 });
  }

  const batch = body.events.slice(0, MAX_BATCH_SIZE);
  const accepted: string[] = [];
  const rejected: Array<{ event_id: string; reason: string }> = [];

  for (const raw of batch) {
    const result = validateEvent(raw);
    if ('reason' in result) rejected.push(result);
    else accepted.push(result.event_id);
  }

  return NextResponse.json({ accepted, rejected });
}
