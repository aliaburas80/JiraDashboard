// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-06: flush orchestration (src/lib/analytics/eventFlush.ts)
// TC-AEF-01 to TC-AEF-06. Uses a real IndexedDB (fake-indexeddb) plus a
// mocked fetch/sendBeacon — verifies the delete-only-on-acknowledgement
// invariant end to end, not just individual function calls.
//
// jest.resetModules() + dynamic imports each test: eventFlush.ts keeps
// module-level retry/backoff state that must not leak between tests, and
// re-requiring fake-indexeddb/auto after a reset gives each test a fresh,
// empty simulated database instead of one shared across the whole file.
// (Backoff is a passive Date.now()-checked gate, not a self-scheduling
// setTimeout, specifically so no real timer can ever outlive a test.)

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

async function freshModules() {
  jest.resetModules();
  await import('fake-indexeddb/auto');
  const eventQueue = await import('../lib/analytics/eventQueue');
  const eventFlush = await import('../lib/analytics/eventFlush');
  return { eventQueue, eventFlush };
}

beforeEach(() => {
  (global as any).fetch = jest.fn();
});

test('TC-AEF-01: a successful flush deletes accepted and rejected events, keeps unacknowledged ones', async () => {
  const { eventQueue, eventFlush } = await freshModules();
  const accepted = makeEvent();
  const rejected = makeEvent();
  const unacked  = makeEvent();
  await eventQueue.enqueueEvent(accepted);
  await eventQueue.enqueueEvent(rejected);
  await eventQueue.enqueueEvent(unacked);

  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      accepted: [accepted.event_id],
      rejected: [{ event_id: rejected.event_id, reason: 'invalid_schema' }],
    }),
  });

  await eventFlush.flushQueue();
  const remaining = await eventQueue.getQueuedEvents(1000);
  const remainingIds = remaining.map(e => e.event_id);

  expect(remainingIds).not.toContain(accepted.event_id);
  expect(remainingIds).not.toContain(rejected.event_id);
  expect(remainingIds).toContain(unacked.event_id);
});

test('TC-AEF-02: a network failure leaves all events queued and does not throw', async () => {
  const { eventQueue, eventFlush } = await freshModules();
  const event = makeEvent();
  await eventQueue.enqueueEvent(event);
  (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

  await expect(eventFlush.flushQueue()).resolves.toBeUndefined();
  const remaining = await eventQueue.getQueuedEvents(1000);

  expect(remaining.some(e => e.event_id === event.event_id)).toBe(true);
});

test('TC-AEF-03: a non-2xx response leaves all events queued', async () => {
  const { eventQueue, eventFlush } = await freshModules();
  const event = makeEvent();
  await eventQueue.enqueueEvent(event);
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

  await eventFlush.flushQueue();
  const remaining = await eventQueue.getQueuedEvents(1000);

  expect(remaining.some(e => e.event_id === event.event_id)).toBe(true);
});

test('TC-AEF-04: the useBeacon path calls sendBeacon and deletes nothing', async () => {
  const { eventQueue, eventFlush } = await freshModules();
  const event = makeEvent();
  await eventQueue.enqueueEvent(event);
  const sendBeacon = jest.fn((_url: string, _data?: BodyInit) => true);
  Object.defineProperty(global, 'navigator', { value: { sendBeacon }, writable: true, configurable: true });

  await eventFlush.flushQueue({ useBeacon: true });
  const remaining = await eventQueue.getQueuedEvents(1000);

  expect(sendBeacon).toHaveBeenCalledTimes(1);
  expect(sendBeacon.mock.calls[0][0]).toBe('/api/events');
  expect(global.fetch).not.toHaveBeenCalled();
  expect(remaining.some(e => e.event_id === event.event_id)).toBe(true);
});

test('TC-AEF-05: flushing an empty queue does not call fetch', async () => {
  const { eventFlush } = await freshModules();

  await eventFlush.flushQueue();

  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-AEF-06: a batch is capped at 50 events even when more are queued', async () => {
  const { eventQueue, eventFlush } = await freshModules();
  for (let i = 0; i < 55; i++) await eventQueue.enqueueEvent(makeEvent());
  let sentCount = 0;
  (global.fetch as jest.Mock).mockImplementation(async (_url: string, init: any) => {
    sentCount = JSON.parse(init.body).events.length;
    return { ok: true, json: async () => ({ accepted: [], rejected: [] }) };
  });

  await eventFlush.flushQueue();

  expect(sentCount).toBeLessThanOrEqual(50);
});
