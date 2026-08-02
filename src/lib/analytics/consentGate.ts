// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: client-side cache of the analytics consent decision (P0B-03,
// GET/POST /api/consent). trackEvent() (see track.ts) must never fire its
// transport without checking this — the Settings → Privacy toggle promises
// "this preference will be honored once we do [collect]," and this module is
// the enforcement point. Default is always false (fail closed): unauthenticated,
// not-yet-decided, and explicitly-declined all resolve the same way as
// getConsentStatus()'s own safe default.

import { getCachedUser } from '@/lib/currentUser';

let cachedGranted: boolean | null = null;
let inFlight: Promise<boolean> | null = null;

export async function getAnalyticsConsent(): Promise<boolean> {
  if (cachedGranted !== null) return cachedGranted;
  // No plausible session — skip the network round-trip; there is nothing an
  // anonymous visitor could have consented to yet (see plan decision 2).
  if (!getCachedUser()) return false;
  if (inFlight) return inFlight;

  inFlight = fetch('/api/consent')
    .then(res => (res.ok ? res.json() : null))
    .then(data => {
      const granted = data?.consent?.analytics?.granted === true;
      cachedGranted = granted;
      return granted;
    })
    .catch(() => false) // network failure — do not collect
    .finally(() => { inFlight = null; });
  return inFlight;
}

/** Call immediately after a successful POST /api/consent toggle. */
export function setAnalyticsConsentCache(granted: boolean): void {
  cachedGranted = granted;
}

/** Call on logout so the next signed-in user's consent isn't inherited. */
export function clearAnalyticsConsentCache(): void {
  cachedGranted = null;
}
