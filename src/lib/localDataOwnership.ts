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

/**
 * Call right after writing per-account data to tag who wrote it. Must be
 * awaited by the caller before anything else reads or navigates away from
 * that data — this used to be fire-and-forget, which raced the immediate
 * post-upload redirect: isOwnedByCurrentUser() on the newly-loaded page could
 * run its own /api/auth/me check and find no owner tag yet (the write here
 * hadn't landed), concluding the just-saved data was "unverified" and
 * discarding it — the freshly uploaded sheet would vanish and the user got
 * bounced back to the upload screen. P0 fix, 2026-07-08.
 */
export async function tagCurrentOwner(ownerKey: string): Promise<void> {
  const user = await fetchCurrentUser().catch(() => null);
  setStoredOwner(ownerKey, user?.userId ?? null);
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
