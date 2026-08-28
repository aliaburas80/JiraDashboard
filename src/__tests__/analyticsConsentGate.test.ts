// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Analytics consent cache tests. Anonymous collection is explicit opt-in and
// signed-in consent remains account-scoped/server-backed.

export {};

let mockCachedUser: { userId: string } | null = null;

jest.mock('@/lib/currentUser', () => ({
  getCachedUser: () => mockCachedUser,
}));

beforeEach(() => {
  jest.resetModules();
  mockCachedUser = null;
  (global as any).fetch = jest.fn();
  window.localStorage.clear();
});

test('TC-ACG-01: anonymous analytics fails closed before a decision', async () => {
  const { getAnalyticsConsent } = await import('../lib/analytics/consentGate');
  const granted = await getAnalyticsConsent();

  expect(granted).toBe(false);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-ACG-02: explicit anonymous opt-in is browser-local and does not fetch', async () => {
  const { getAnalyticsConsent, setAnonymousAnalyticsConsent } = await import('../lib/analytics/consentGate');
  setAnonymousAnalyticsConsent(true);

  await expect(getAnalyticsConsent()).resolves.toBe(true);
  expect(window.localStorage.getItem('dc:analyticsConsent.v1')).toBe('granted');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-ACG-03: fetches /api/consent once for a signed-in user and returns the granted flag', async () => {
  mockCachedUser = { userId: 'user-1' };
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ consent: { analytics: { granted: true } } }),
  });

  const { getAnalyticsConsent } = await import('../lib/analytics/consentGate');
  const first = await getAnalyticsConsent();
  const second = await getAnalyticsConsent();

  expect(first).toBe(true);
  expect(second).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('TC-ACG-04: signed-in consent does not inherit an earlier anonymous grant', async () => {
  const module = await import('../lib/analytics/consentGate');
  module.setAnonymousAnalyticsConsent(true);

  mockCachedUser = { userId: 'user-1' };
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ consent: { analytics: { granted: false } } }),
  });

  await expect(module.getAnalyticsConsent()).resolves.toBe(false);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('TC-ACG-05: a signed-in fetch failure resolves to false, not a rejection', async () => {
  mockCachedUser = { userId: 'user-1' };
  (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

  const { getAnalyticsConsent } = await import('../lib/analytics/consentGate');
  await expect(getAnalyticsConsent()).resolves.toBe(false);
});

test('TC-ACG-06: setAnalyticsConsentCache short-circuits future signed-in calls', async () => {
  mockCachedUser = { userId: 'user-1' };
  const { getAnalyticsConsent, setAnalyticsConsentCache } = await import('../lib/analytics/consentGate');

  setAnalyticsConsentCache(true);
  const granted = await getAnalyticsConsent();

  expect(granted).toBe(true);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('TC-ACG-07: clearAnalyticsConsentCache forces a signed-in re-fetch', async () => {
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
