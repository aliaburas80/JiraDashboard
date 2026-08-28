// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Consent gate for product analytics. Signed-in consent is stored server-side;
// anonymous visitors may make an explicit browser-local choice so public-launch
// acquisition and pre-signup journeys can be measured without tracking anyone
// who has not opted in.

import { getCachedUser } from '@/lib/currentUser';

const ANONYMOUS_CONSENT_KEY = 'dc:analyticsConsent.v1';

let cachedUserId: string | null = null;
let cachedGranted: boolean | null = null;
let inFlightUserId: string | null = null;
let inFlight: Promise<boolean> | null = null;

function readAnonymousDecision(): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(ANONYMOUS_CONSENT_KEY);
    if (value === 'granted') return true;
    if (value === 'denied') return false;
  } catch {
    // Storage may be unavailable in hardened/private browser modes. Fail closed.
  }
  return null;
}

export function getAnonymousAnalyticsConsentDecision(): boolean | null {
  return readAnonymousDecision();
}

export function setAnonymousAnalyticsConsent(granted: boolean): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ANONYMOUS_CONSENT_KEY, granted ? 'granted' : 'denied');
    } catch {
      // Keep the current page functional even when browser storage is blocked.
    }
  }

  // Anonymous consent must never become the signed-in account's consent by
  // accident. It is only cached here while there is no authenticated user.
  if (!getCachedUser()) {
    cachedUserId = null;
    cachedGranted = granted;
  }
}

export async function getAnalyticsConsent(): Promise<boolean> {
  const user = getCachedUser();

  if (!user) {
    if (cachedUserId === null && cachedGranted !== null) return cachedGranted;
    return readAnonymousDecision() === true;
  }

  if (cachedUserId === user.userId && cachedGranted !== null) return cachedGranted;
  if (inFlight && inFlightUserId === user.userId) return inFlight;

  inFlightUserId = user.userId;
  inFlight = fetch('/api/consent')
    .then(res => (res.ok ? res.json() : null))
    .then(data => {
      const granted = data?.consent?.analytics?.granted === true;
      cachedUserId = user.userId;
      cachedGranted = granted;
      return granted;
    })
    .catch(() => false)
    .finally(() => {
      inFlight = null;
      inFlightUserId = null;
    });

  return inFlight;
}

/** Call immediately after a successful signed-in POST /api/consent toggle. */
export function setAnalyticsConsentCache(granted: boolean): void {
  const user = getCachedUser();
  cachedUserId = user?.userId ?? null;
  cachedGranted = granted;
}

/** Call on logout so a subsequent signed-in user's consent is never inherited. */
export function clearAnalyticsConsentCache(): void {
  cachedUserId = null;
  cachedGranted = null;
  inFlight = null;
  inFlightUserId = null;
}
