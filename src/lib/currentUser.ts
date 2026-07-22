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
//
// Also mirrored to sessionStorage: the in-memory variable alone only survives
// client-side navigations, not a hard page reload (which re-evaluates this
// module from scratch). Without the mirror, a hard reload briefly renders
// role-filtered nav (AppShell's getNavGroupsForRole) with no role at all,
// then re-renders once the /api/auth/me fetch resolves — a visible nav-group
// shift a moment after the page appears. Seeding from sessionStorage makes
// the first render already-correct on reloads too, not just soft navigations.
// sessionStorage (not localStorage) so it never survives past the browser
// tab/session, matching clearCachedUser()'s logout intent.

const STORAGE_KEY = 'dc:currentUser';

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword?: boolean;
  emailVerified?: boolean;
  dataStorageMode?: 'cloud' | 'local';
  // EP-025: gates the Members directory nav item — distinct from role: 'admin'.
  isSuperAdmin?: boolean;
}

function readPersistedUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

function persistUser(user: CurrentUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage unavailable (private browsing, quota, etc.) — the
    // in-memory cache still works for the rest of this page's lifetime.
  }
}

let cachedUser: CurrentUser | null = readPersistedUser();
let inFlight: Promise<CurrentUser | null> | null = null;

export function getCachedUser(): CurrentUser | null {
  return cachedUser;
}

export function getCachedRole(): string | null {
  return cachedUser?.role ?? null;
}

export function getCachedIsSuperAdmin(): boolean {
  return cachedUser?.isSuperAdmin === true;
}

export function fetchCurrentUser(): Promise<CurrentUser | null> {
  if (inFlight) return inFlight;
  inFlight = fetch('/api/auth/me')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      cachedUser = data ?? null;
      persistUser(cachedUser);
      return cachedUser;
    })
    .catch(() => cachedUser) // keep the last known value on a transient failure
    .finally(() => { inFlight = null; });
  return inFlight;
}

/** Call after logout so a subsequent login doesn't briefly show the previous user. */
export function clearCachedUser(): void {
  cachedUser = null;
  persistUser(null);
}
