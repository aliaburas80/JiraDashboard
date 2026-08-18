// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// POST /api/events — receive a batch of product events from the P0B-06
// client queue (src/lib/analytics/eventFlush.ts).
//
// P0B-07: validates the full v1 envelope, persists accepted events, and uses
// event_id as an idempotency key. Duplicate retries are acknowledged as
// accepted but never create duplicate rows. A storage failure returns 503 so
// the client queue keeps the events and retries later.
//
// Public endpoint (no auth) — consent is enforced client-side by P0B-05's
// getAnalyticsConsent() gate before an event is produced. The server still
// treats every field as untrusted input and validates it before persistence.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAnalyticsEventName } from '@/lib/analytics/eventTaxonomy';

export const dynamic = 'force-dynamic';

const MAX_BATCH_SIZE = 50;
const MAX_PROPERTIES = 50;
const MAX_PROPERTIES_JSON_BYTES = 16_384;
const POSTGRES_INT_MAX = 2_147_483_647;

interface PersistableAnalyticsEvent {
  eventId: string;
  schemaVersion: number;
  eventName: string;
  occurredAt: Date;
  userId: string | null;
  anonymousId: string | null;
  sessionId: string | null;
  page: string;
  section: string | null;
  component: string | null;
  appVersion: string;
  role: string | null;
  browserFamily: string;
  browserMajor: string;
  osFamily: string;
  deviceCategory: string;
  resultStatus: string | null;
  durationMs: number | null;
  propertiesJson: string;
}

type ValidationResult =
  | { event_id: string; data: PersistableAnalyticsEvent }
  | { event_id: string; reason: string };

// ── Rate limit — same LoginAttempt-table sliding-window pattern as
// app/api/events/error/route.ts, different key prefix. ────────────────────────

async function isEventsRateLimited(ip: string): Promise<boolean> {
  const key         = `ev:${ip}`;
  const WINDOW_MS   = 15 * 60_000;
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const prunePoint  = new Date(Date.now() - 60 * 60_000);

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

function requiredString(
  event: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | null {
  const value = event[key];
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength ? value : null;
}

function optionalString(
  event: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | null | undefined {
  const value = event[key];
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > maxLength) return undefined;
  return value;
}

function serializeProperties(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_PROPERTIES) return null;

  for (const [key, propertyValue] of entries) {
    if (!key || key.length > 128) return null;
    const validValue = propertyValue === null
      || typeof propertyValue === 'string'
      || typeof propertyValue === 'boolean'
      || (typeof propertyValue === 'number' && Number.isFinite(propertyValue));
    if (!validValue) return null;
    if (typeof propertyValue === 'string' && propertyValue.length > 2_048) return null;
  }

  const json = JSON.stringify(value);
  return Buffer.byteLength(json, 'utf8') <= MAX_PROPERTIES_JSON_BYTES ? json : null;
}

function validateEvent(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { event_id: '', reason: 'not_an_object' };
  }

  const event = raw as Record<string, unknown>;
  const eventId = typeof event.event_id === 'string' ? event.event_id : '';

  if (!eventId) return { event_id: '', reason: 'missing_event_id' };
  if (eventId.length > 128) return { event_id: eventId, reason: 'invalid_schema' };
  if (event.schema_version === undefined) return { event_id: eventId, reason: 'missing_schema_version' };
  if (event.schema_version !== 1) return { event_id: eventId, reason: 'unsupported_schema_version' };
  if (typeof event.event_name !== 'string' || !isAnalyticsEventName(event.event_name)) {
    return { event_id: eventId, reason: 'invalid_schema' };
  }

  const occurredAtRaw = requiredString(event, 'occurred_at', 64);
  const page = requiredString(event, 'page', 2_048);
  const appVersion = requiredString(event, 'app_version', 64);
  const browserFamily = requiredString(event, 'browser_family', 128);
  const browserMajor = requiredString(event, 'browser_major', 32);
  const osFamily = requiredString(event, 'os_family', 128);
  const deviceCategory = requiredString(event, 'device_category', 64);

  if (!occurredAtRaw || !page || !appVersion || !browserFamily || !browserMajor || !osFamily || !deviceCategory) {
    return { event_id: eventId, reason: 'invalid_schema' };
  }

  const occurredAt = new Date(occurredAtRaw);
  if (Number.isNaN(occurredAt.getTime())) {
    return { event_id: eventId, reason: 'invalid_occurred_at' };
  }

  const userId = optionalString(event, 'user_id', 128);
  const anonymousId = optionalString(event, 'anonymous_id', 128);
  const sessionId = optionalString(event, 'session_id', 128);
  const section = optionalString(event, 'section', 256);
  const component = optionalString(event, 'component', 256);
  const role = optionalString(event, 'role', 64);
  const resultStatus = optionalString(event, 'result_status', 128);
  if (
    userId === undefined || anonymousId === undefined || sessionId === undefined
    || section === undefined || component === undefined || role === undefined
    || resultStatus === undefined
  ) {
    return { event_id: eventId, reason: 'invalid_schema' };
  }

  const durationRaw = event.duration_ms;
  const durationMs = durationRaw === null
    ? null
    : typeof durationRaw === 'number'
      && Number.isInteger(durationRaw)
      && durationRaw >= 0
      && durationRaw <= POSTGRES_INT_MAX
      ? durationRaw
      : undefined;
  if (durationMs === undefined) return { event_id: eventId, reason: 'invalid_schema' };

  const propertiesJson = serializeProperties(event.properties);
  if (propertiesJson === null) return { event_id: eventId, reason: 'invalid_properties' };

  return {
    event_id: eventId,
    data: {
      eventId,
      schemaVersion: 1,
      eventName: event.event_name,
      occurredAt,
      userId,
      anonymousId,
      sessionId,
      page,
      section,
      component,
      appVersion,
      role,
      browserFamily,
      browserMajor,
      osFamily,
      deviceCategory,
      resultStatus,
      durationMs,
      propertiesJson,
    },
  };
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
  const valid: Array<{ event_id: string; data: PersistableAnalyticsEvent }> = [];
  const rejected: Array<{ event_id: string; reason: string }> = [];

  for (const raw of batch) {
    const result = validateEvent(raw);
    if ('reason' in result) rejected.push(result);
    else valid.push(result);
  }

  if (valid.length > 0) {
    try {
      // skipDuplicates turns event_id into a true idempotency key: beacon/fetch
      // retries are safe, and already-stored events remain acknowledged below.
      await prisma.productAnalyticsEvent.createMany({
        data: valid.map(event => event.data),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('[analytics] failed to persist event batch', error);
      return NextResponse.json({ accepted: [], rejected: [] }, { status: 503 });
    }
  }

  return NextResponse.json({
    accepted: valid.map(event => event.event_id),
    rejected,
  });
}
