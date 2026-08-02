// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: envelope construction + consent gating (src/lib/analytics/track.ts)
// TC-ATR-01 to TC-ATR-07. The transport is injected via
// configureAnalyticsTransport() so these tests observe the exact envelope
// without any real delivery mechanism existing yet (see track.ts header).

export {};

let mockCachedUser: { userId: string; role: string } | null = { userId: 'user-1', role: 'scrum_master' };
let mockConsent = true;

jest.mock('@/lib/currentUser', () => ({
  getCachedUser: () => mockCachedUser,
}));

jest.mock('../lib/analytics/consentGate', () => ({
  getAnalyticsConsent: jest.fn(async () => mockConsent),
}));

if (typeof global.window === 'undefined') {
  Object.defineProperty(global, 'window', { value: global, writable: true });
}
Object.defineProperty(global, 'location', { value: { pathname: '/dashboard/flow-health' }, writable: true, configurable: true });

const lsStore: Record<string, Record<string, string>> = { local: {}, session: {} };
function makeStorage(bucket: 'local' | 'session') {
  return {
    getItem:    (k: string)            => lsStore[bucket][k] ?? null,
    setItem:    (k: string, v: string) => { lsStore[bucket][k] = v; },
    removeItem: (k: string)            => { delete lsStore[bucket][k]; },
    clear:      ()                     => { lsStore[bucket] = {}; },
  };
}
Object.defineProperty(global, 'localStorage', { value: makeStorage('local'), writable: true, configurable: true });
Object.defineProperty(global, 'sessionStorage', { value: makeStorage('session'), writable: true, configurable: true });
Object.defineProperty(global, 'navigator', {
  value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36' },
  writable: true,
  configurable: true,
});

const flushMicrotasks = () => new Promise(resolve => setImmediate(resolve));

beforeEach(() => {
  jest.resetModules();
  mockCachedUser = { userId: 'user-1', role: 'scrum_master' };
  mockConsent = true;
  lsStore.local = {};
  lsStore.session = {};
});

test('TC-ATR-01: a granted-consent event is built with the full §6.2 envelope shape', async () => {
  const { trackEvent, configureAnalyticsTransport } = await import('../lib/analytics/track');
  const transport = jest.fn();
  configureAnalyticsTransport(transport);

  trackEvent('dashboard_viewed', { widgetCount: 3 }, { section: 'flow-health' });
  await flushMicrotasks();

  expect(transport).toHaveBeenCalledTimes(1);
  const event = transport.mock.calls[0][0];
  expect(event.event_name).toBe('dashboard_viewed');
  expect(event.schema_version).toBe(1);
  expect(event.event_id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(new Date(event.occurred_at).toISOString()).toBe(event.occurred_at);
  expect(event.user_id).toBe('user-1');
  expect(event.role).toBe('scrum_master');
  expect(event.page).toBe('/dashboard/flow-health');
  expect(event.section).toBe('flow-health');
  expect(event.browser_family).toBe('Chrome');
  expect(event.os_family).toBe('Windows');
  expect(event.device_category).toBe('desktop');
  expect(event.properties).toEqual({ widgetCount: 3 });
});

test('TC-ATR-02: no transport call when consent is not granted', async () => {
  mockConsent = false;
  const { trackEvent, configureAnalyticsTransport } = await import('../lib/analytics/track');
  const transport = jest.fn();
  configureAnalyticsTransport(transport);

  trackEvent('dashboard_viewed');
  await flushMicrotasks();

  expect(transport).not.toHaveBeenCalled();
});

test('TC-ATR-03: no transport call for an unauthenticated session (consent gate returns false)', async () => {
  mockCachedUser = null;
  mockConsent = false;
  const { trackEvent, configureAnalyticsTransport } = await import('../lib/analytics/track');
  const transport = jest.fn();
  configureAnalyticsTransport(transport);

  trackEvent('page_viewed');
  await flushMicrotasks();

  expect(transport).not.toHaveBeenCalled();
});

test('TC-ATR-04: an unknown event name is dropped without invoking the transport', async () => {
  const { trackEvent, configureAnalyticsTransport } = await import('../lib/analytics/track');
  const transport = jest.fn();
  configureAnalyticsTransport(transport);

  trackEvent('not_a_real_event' as any);
  await flushMicrotasks();

  expect(transport).not.toHaveBeenCalled();
});

test('TC-ATR-05: anonymous_id and session_id are stable across repeated calls', async () => {
  const { trackEvent, configureAnalyticsTransport } = await import('../lib/analytics/track');
  const transport = jest.fn();
  configureAnalyticsTransport(transport);

  trackEvent('page_viewed');
  trackEvent('page_viewed');
  await flushMicrotasks();

  expect(transport).toHaveBeenCalledTimes(2);
  const [first, second] = transport.mock.calls.map(call => call[0]);
  expect(first.anonymous_id).toBe(second.anonymous_id);
  expect(first.session_id).toBe(second.session_id);
  expect(first.anonymous_id).toBeTruthy();
});

test('TC-ATR-06: event_id is unique per call', async () => {
  const { trackEvent, configureAnalyticsTransport } = await import('../lib/analytics/track');
  const transport = jest.fn();
  configureAnalyticsTransport(transport);

  trackEvent('page_viewed');
  trackEvent('page_viewed');
  await flushMicrotasks();

  const [first, second] = transport.mock.calls.map(call => call[0]);
  expect(first.event_id).not.toBe(second.event_id);
});

test('TC-ATR-07: user_id/role are null when no session is cached but consent is (hypothetically) granted', async () => {
  mockCachedUser = null;
  mockConsent = true;
  const { trackEvent, configureAnalyticsTransport } = await import('../lib/analytics/track');
  const transport = jest.fn();
  configureAnalyticsTransport(transport);

  trackEvent('page_viewed');
  await flushMicrotasks();

  const event = transport.mock.calls[0][0];
  expect(event.user_id).toBeNull();
  expect(event.role).toBeNull();
});
