// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Module-level cache for GET /api/auth/me, shared by every component that needs
// the signed-in user's identity/role (AppShell, DashboardTopbar, UserMenu).
// AppShell is imported directly by ~28 individual page.tsx files rather than one
// shared layout, so it (and its children, like UserMenu) fully unmount/remount on
// every route change. Without this cache, each of those components independently
// re-fetched /api/auth/me on every mount and started from a blank/logged-out
// state while waiting — UserMenu specifically flashed "Sign in" before the
// username reappeared on every single navigation. Reading the cached value
// synchronously as the initial state means these components render
// already-correct from the first paint after the first successful fetch each
// session.

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword?: boolean;
  emailVerified?: boolean;
  dataStorageMode?: 'cloud' | 'local';
}

let cachedUser: CurrentUser | null = null;
let inFlight: Promise<CurrentUser | null> | null = null;

export function getCachedUser(): CurrentUser | null {
  return cachedUser;
}

export function getCachedRole(): string | null {
  return cachedUser?.role ?? null;
}

export function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (inFlight) return inFlight;
  inFlight = fetch('/api/auth/me')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      cachedUser = data ?? null;
      return cachedUser;
    })
    .catch(() => cachedUser) // keep the last known value on a transient failure
    .finally(() => { inFlight = null; });
  return inFlight;
}

/** Call after logout so a subsequent login doesn't briefly show the previous user. */
export function clearCachedUser(): void {
  cachedUser = null;
}
