// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Module-level cache for the signed-in user's role, shared by every nav-rendering
// component (AppShell.tsx, DashboardTopbar.tsx). AppShell is imported directly by
// ~28 individual page.tsx files rather than one shared layout, so it fully
// unmounts/remounts on every route change — without this cache, the role-fetch
// effect re-ran on every navigation and the header nav visibly flashed from
// unfiltered/default back to role-filtered each time. Reading the cached value
// synchronously as the initial state means the nav renders already-correct from
// the first paint after the first successful fetch this session.

let cachedRole: string | null = null;
let hasFetched = false;
let inFlight: Promise<string | null> | null = null;

export function getCachedRole(): string | null {
  return cachedRole;
}

export function fetchCurrentRole(): Promise<string | null> {
  if (inFlight) return inFlight;
  inFlight = fetch('/api/auth/me')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      cachedRole = data?.role ?? null;
      hasFetched = true;
      return cachedRole;
    })
    .catch(() => {
      hasFetched = true;
      return cachedRole;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}

export function hasFetchedRole(): boolean {
  return hasFetched;
}
