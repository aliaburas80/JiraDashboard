// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Shared "is this locally-cached data mine?" check. Browser localStorage is
// scoped to the browser, not the logged-in account — two different accounts
// signed into the same browser (a shared/demo machine, or logging into a
// second account without explicitly signing out of the first) would
// otherwise read each other's cached per-account data. Any localStorage key
// that holds real per-account data (not just a UI preference) must be tagged
// with its owner at write time and re-verified against the live,
// server-verified session (not client state, which can't be trusted) before
// being read. P0 fix, 2026-07-08.

import { fetchCurrentUser } from '@/lib/currentUser';

export function getStoredOwner(ownerKey: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(ownerKey); } catch { return null; }
}

export function setStoredOwner(ownerKey: string, userId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) localStorage.setItem(ownerKey, userId);
    else localStorage.removeItem(ownerKey);
  } catch {}
}

/** Fire-and-forget — call right after writing per-account data to tag who wrote it. */
export function tagCurrentOwner(ownerKey: string): void {
  fetchCurrentUser().then(user => setStoredOwner(ownerKey, user?.userId ?? null)).catch(() => {});
}

/**
 * Authoritative check — verifies the stored owner tag against the live
 * session (GET /api/auth/me), not cached/stale client state. Untagged data
 * (e.g. written before this fix shipped) is treated as untrusted, not as
 * "no owner recorded, assume it's fine".
 */
export async function isOwnedByCurrentUser(ownerKey: string): Promise<boolean> {
  const storedOwner = getStoredOwner(ownerKey);
  const currentUser = await fetchCurrentUser();
  return !!storedOwner && !!currentUser && storedOwner === currentUser.userId;
}
