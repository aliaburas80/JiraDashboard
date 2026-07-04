// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-019 follow-up: AppShell is imported directly by ~28 pages rather than one
// shared layout, so it fully remounts on every route change. Without a shared
// cache, its role-fetch effect re-ran every navigation and the header nav
// visibly flashed from unfiltered/default back to role-filtered each time.

import { getCachedRole, fetchCurrentRole } from '../lib/currentRole';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks(); });

test('TC-ROLE-01: getCachedRole returns null before any fetch has resolved', () => {
  expect(getCachedRole()).toBeNull();
});

test('TC-ROLE-02: fetchCurrentRole resolves and populates the cache for subsequent synchronous reads', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ role: 'admin' }) })) as any;

  const role = await fetchCurrentRole();
  expect(role).toBe('admin');
  expect(getCachedRole()).toBe('admin'); // simulates the next AppShell mount reading it synchronously
});

test('TC-ROLE-03: concurrent calls while a fetch is in flight share the same request (no duplicate network calls)', async () => {
  const fetchSpy = jest.fn(async () => ({ ok: true, json: async () => ({ role: 'manager' }) }));
  global.fetch = fetchSpy as any;

  const [a, b] = await Promise.all([fetchCurrentRole(), fetchCurrentRole()]);
  expect(a).toBe('manager');
  expect(b).toBe('manager');
  expect(fetchSpy).toHaveBeenCalledTimes(1);
});

test('TC-ROLE-04: a failed fetch resolves to the last known cached value rather than throwing', async () => {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ role: 'c_level' }) })) as any;
  await fetchCurrentRole();

  global.fetch = jest.fn(async () => { throw new Error('network down'); }) as any;
  const role = await fetchCurrentRole();
  expect(role).toBe('c_level');
});
