// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: analytics consent cache (src/lib/analytics/consentGate.ts) — TC-ACG-01 to TC-ACG-05
// trackEvent() must never fire its transport without this returning true —
// see track.ts and analyticsTrack.test.ts for the enforcement side.

export {};

let mockCachedUser: { userId: string } | null = null;

jest.mock('@/lib/currentUser', () => ({
  getCachedUser: () => mockCachedUser,
}));

beforeEach(() => {
  jest.resetModules();
  mockCachedUser = null;
  (global as any).fetch = jest.fn();
});

test('TC-ACG-01: returns false without fetching when no session is cached', async () => {
  const { getAnalyticsConsent } = await import('../lib/analytics/consentGate');
  const granted = await getAnalyticsConsent();

  expect(granted).toBe(false);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-ACG-02: fetches /api/consent once for a signed-in user and returns the granted flag', async () => {
  mockCachedUser = { userId: 'user-1' };
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ consent: { analytics: { granted: true } } }),
  });

  const { getAnalyticsConsent } = await import('../lib/analytics/consentGate');
  const first  = await getAnalyticsConsent();
  const second = await getAnalyticsConsent();

  expect(first).toBe(true);
  expect(second).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('TC-ACG-03: a fetch failure resolves to false, not a rejection', async () => {
  mockCachedUser = { userId: 'user-1' };
  (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

  const { getAnalyticsConsent } = await import('../lib/analytics/consentGate');
  await expect(getAnalyticsConsent()).resolves.toBe(false);
});

test('TC-ACG-04: setAnalyticsConsentCache short-circuits future calls without fetching', async () => {
  mockCachedUser = { userId: 'user-1' };
  const { getAnalyticsConsent, setAnalyticsConsentCache } = await import('../lib/analytics/consentGate');

  setAnalyticsConsentCache(true);
  const granted = await getAnalyticsConsent();

  expect(granted).toBe(true);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-ACG-05: clearAnalyticsConsentCache forces a re-fetch on the next call', async () => {
  mockCachedUser = { userId: 'user-1' };
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ consent: { analytics: { granted: false } } }),
  });
  const { getAnalyticsConsent, setAnalyticsConsentCache, clearAnalyticsConsentCache } =
    await import('../lib/analytics/consentGate');

  setAnalyticsConsentCache(true);
  clearAnalyticsConsentCache();
  const granted = await getAnalyticsConsent();

  expect(granted).toBe(false);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
