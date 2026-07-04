// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-019 follow-up: UserMenu.tsx is a child of AppShell, which is imported
// directly by ~28 pages rather than one shared layout, so it fully remounts on
// every route change. Without a shared cache, its /api/auth/me fetch re-ran on
// every navigation and the username visibly flashed to "Sign in" and back each
// time while waiting for the fetch to resolve.

import { getCachedUser, getCachedRole, fetchCurrentUser, clearCachedUser } from '../lib/currentUser';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); clearCachedUser(); });

test('TC-USER-01: getCachedUser returns null before any fetch has resolved', () => {
  expect(getCachedUser()).toBeNull();
  expect(getCachedRole()).toBeNull();
});

test('TC-USER-02: fetchCurrentUser resolves and populates the cache for subsequent synchronous reads', async () => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ userId: 'user-1', email: 'sam@test.com', name: 'Sam', role: 'admin' }),
  })) as any;

  const user = await fetchCurrentUser();
  expect(user?.name).toBe('Sam');
  expect(getCachedUser()?.email).toBe('sam@test.com'); // simulates the next UserMenu mount reading it synchronously
  expect(getCachedRole()).toBe('admin');
});

test('TC-USER-03: concurrent calls while a fetch is in flight share the same request (no duplicate network calls)', async () => {
  const fetchSpy = jest.fn(async () => ({
    ok: true,
    json: async () => ({ userId: 'user-2', email: 'robin@test.com', name: 'Robin', role: 'manager' }),
  }));
  global.fetch = fetchSpy as any;

  const [a, b] = await Promise.all([fetchCurrentUser(), fetchCurrentUser()]);
  expect(a?.name).toBe('Robin');
  expect(b?.name).toBe('Robin');
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});

test('TC-USER-04: a failed fetch resolves to the last known cached value rather than throwing', async () => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ userId: 'user-3', email: 'ali@test.com', name: 'Ali', role: 'c_level' }),
  })) as any;
  await fetchCurrentUser();

  global.fetch = jest.fn(async () => { throw new Error('network down'); }) as any;
  const user = await fetchCurrentUser();
  expect(user?.name).toBe('Ali');
});

test('TC-USER-05: clearCachedUser resets the cache so a subsequent read reflects logout', async () => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ userId: 'user-4', email: 'sam@test.com', name: 'Sam', role: 'user' }),
  })) as any;
  await fetchCurrentUser();
  expect(getCachedUser()).not.toBeNull();

  clearCachedUser();
  expect(getCachedUser()).toBeNull();
});
