// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-06: batching/retry/network orchestration for the analytics event
// queue (master plan §4.7). Delegates all storage to eventQueue.ts; this
// module owns triggers, delivery, and delete-only-on-acknowledgement.

import { configureAnalyticsTransport, type AnalyticsEvent } from './track';
import { ANALYTICS_EVENT_DOMAINS } from './eventTaxonomy';
import {
  enqueueEvent,
  getQueuedEvents,
  deleteEvents,
  countQueuedEvents,
  pruneExpiredEvents,
  enforceMaxQueueSize,
} from './eventQueue';

const FLUSH_INTERVAL_MS   = 10_000;
const FLUSH_THRESHOLD     = 30;    // within the master plan's 20-50 range
const BATCH_SIZE          = 50;
const MAX_QUEUE_SIZE      = 500;
const MAX_EVENT_AGE_MS    = 24 * 60 * 60 * 1000;
const BASE_BACKOFF_MS     = 5_000;
const MAX_BACKOFF_MS      = 5 * 60 * 1000;

const CRITICAL_EVENT_NAMES: ReadonlySet<string> = new Set(ANALYTICS_EVENT_DOMAINS.quality);

interface AckResponse {
  accepted: string[];
  rejected: Array<{ event_id: string; reason: string }>;
}

let backoffMs            = BASE_BACKOFF_MS;
let nextAttemptAllowedAt = 0; // epoch ms; 0 = no backoff in effect
let flushing             = false;

function jitter(ms: number): number {
  return ms + Math.random() * ms * 0.2 - ms * 0.1; // ±10%
}

// Backoff is a passive gate checked by every trigger (10s interval, online,
// threshold, critical event), not a self-scheduling timer — deliberately:
// the periodic interval already re-attempts regularly, so an *additional*
// self-scheduling setTimeout is redundant complexity that also outlives
// test teardown (a real dangling timer firing into a later, unrelated test
// was confirmed while writing this module's tests).
function registerFailure(): void {
  nextAttemptAllowedAt = Date.now() + jitter(backoffMs);
  backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
}

function registerSuccess(): void {
  backoffMs = BASE_BACKOFF_MS;
  nextAttemptAllowedAt = 0;
}

/**
 * Reads a batch, delivers it, and deletes only what the server acknowledged.
 * `useBeacon` (page-hidden/exit path) is fire-and-forget with no response —
 * events stay queued and are re-flushed (and only then deleted) on the next
 * fetch-based flush, since sendBeacon can't tell us what was accepted.
 */
export async function flushQueue(options: { useBeacon?: boolean } = {}): Promise<void> {
  if (flushing) return;
  if (!options.useBeacon && Date.now() < nextAttemptAllowedAt) return; // backing off
  const events = await getQueuedEvents(BATCH_SIZE);
  if (events.length === 0) return;

  if (options.useBeacon) {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
    navigator.sendBeacon('/api/events', blob);
    return;
  }

  flushing = true;
  try {
    const res = await fetch('/api/events', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ events }),
      keepalive: true,
    });
    if (!res.ok) { registerFailure(); return; }

    const ack: AckResponse = await res.json();
    const acknowledgedIds = [...ack.accepted, ...ack.rejected.map(r => r.event_id)];
    await deleteEvents(acknowledgedIds);
    registerSuccess();
  } catch {
    registerFailure();
  } finally {
    flushing = false;
  }
}

async function handleEnqueuedEvent(event: AnalyticsEvent): Promise<void> {
  await enqueueEvent(event);
  await enforceMaxQueueSize(MAX_QUEUE_SIZE);

  const isCritical = CRITICAL_EVENT_NAMES.has(event.event_name);
  const count = await countQueuedEvents();
  if (isCritical || count >= FLUSH_THRESHOLD) {
    void flushQueue();
  }
}

let initialized = false;

/** Idempotent — safe to call more than once (only the first call takes effect). */
export function initAnalyticsQueue(): void {
  if (initialized) return;
  initialized = true;
  if (typeof window === 'undefined') return;

  configureAnalyticsTransport(event => { void handleEnqueuedEvent(event); });

  void pruneExpiredEvents(MAX_EVENT_AGE_MS).then(() => flushQueue());

  setInterval(() => void flushQueue(), FLUSH_INTERVAL_MS);
  window.addEventListener('online', () => void flushQueue());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void flushQueue({ useBeacon: true });
  });
}
