// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-06: IndexedDB queue storage adapter (src/lib/analytics/eventQueue.ts)
// TC-AEQ-01 to TC-AEQ-08. fake-indexeddb polyfills indexedDB in Node so this
// exercises the real IDB code path, not a hand-rolled mock.

import 'fake-indexeddb/auto';
import {
  enqueueEvent,
  getQueuedEvents,
  deleteEvents,
  countQueuedEvents,
  pruneExpiredEvents,
  enforceMaxQueueSize,
} from '../lib/analytics/eventQueue';
import type { AnalyticsEvent } from '../lib/analytics/track';

function makeEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    event_id: crypto.randomUUID(),
    schema_version: 1,
    event_name: 'page_viewed',
    occurred_at: new Date().toISOString(),
    user_id: 'user-1',
    anonymous_id: 'anon-1',
    session_id: 'session-1',
    page: '/dashboard',
    section: null,
    component: null,
    app_version: '1.0.0',
    role: 'user',
    browser_family: 'Chrome',
    browser_major: '128',
    os_family: 'Windows',
    device_category: 'desktop',
    result_status: null,
    duration_ms: null,
    properties: {},
    ...overrides,
  };
}

// fake-indexeddb simulates real browser persistence — the same database
// instance is shared across every test in this file (no auto-reset between
// tests). Assertions below are deliberately relative (delta counts, specific
// event_id presence/absence) rather than absolute totals, so test order and
// accumulated state from earlier tests never affect correctness.

test('TC-AEQ-01: enqueueEvent + getQueuedEvents round-trips an event', async () => {
  const event = makeEvent();
  await enqueueEvent(event);
  const queued = await getQueuedEvents(10);

  expect(queued.some(e => e.event_id === event.event_id)).toBe(true);
});

test('TC-AEQ-02: countQueuedEvents reflects the number enqueued', async () => {
  const before = await countQueuedEvents();
  await enqueueEvent(makeEvent());
  await enqueueEvent(makeEvent());
  const after = await countQueuedEvents();

  expect(after).toBe(before + 2);
});

test('TC-AEQ-03: deleteEvents removes exactly the given IDs', async () => {
  const a = makeEvent();
  const b = makeEvent();
  await enqueueEvent(a);
  await enqueueEvent(b);

  await deleteEvents([a.event_id]);
  const queued = await getQueuedEvents(1000);

  expect(queued.some(e => e.event_id === a.event_id)).toBe(false);
  expect(queued.some(e => e.event_id === b.event_id)).toBe(true);
});

test('TC-AEQ-04: getQueuedEvents respects the limit', async () => {
  for (let i = 0; i < 5; i++) await enqueueEvent(makeEvent());
  const queued = await getQueuedEvents(2);

  expect(queued).toHaveLength(2);
});

test('TC-AEQ-05: pruneExpiredEvents removes only events older than the cutoff', async () => {
  const stale = makeEvent({ occurred_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() });
  const fresh = makeEvent({ occurred_at: new Date().toISOString() });
  await enqueueEvent(stale);
  await enqueueEvent(fresh);

  await pruneExpiredEvents(24 * 60 * 60 * 1000);
  const queued = await getQueuedEvents(1000);

  expect(queued.some(e => e.event_id === stale.event_id)).toBe(false);
  expect(queued.some(e => e.event_id === fresh.event_id)).toBe(true);
});

test('TC-AEQ-06: enforceMaxQueueSize drops oldest-first when over the cap', async () => {
  const older = makeEvent({ occurred_at: new Date(Date.now() - 10_000).toISOString() });
  const newer = makeEvent({ occurred_at: new Date().toISOString() });
  await enqueueEvent(older);
  await enqueueEvent(newer);

  await enforceMaxQueueSize(1);
  const queued = await getQueuedEvents(1000);

  expect(queued.some(e => e.event_id === older.event_id)).toBe(false);
  expect(queued.some(e => e.event_id === newer.event_id)).toBe(true);
});

test('TC-AEQ-07: enforceMaxQueueSize is a no-op when under the cap', async () => {
  const event = makeEvent();
  await enqueueEvent(event);
  const before = await countQueuedEvents();

  await enforceMaxQueueSize(before + 10);
  const after = await countQueuedEvents();

  expect(after).toBe(before);
});

test('TC-AEQ-08: deleteEvents with an empty array is a safe no-op', async () => {
  const before = await countQueuedEvents();
  await deleteEvents([]);
  const after = await countQueuedEvents();

  expect(after).toBe(before);
});
