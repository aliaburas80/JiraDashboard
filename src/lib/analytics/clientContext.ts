// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: browser-local context for the analytics envelope (§6.2) —
// pseudonymous/session identity plus browser/OS/device detection.
// Promoted from FeedbackButton.tsx's inline getBrowserFamily() so both the
// feedback widget and the analytics SDK share one implementation.

const ANONYMOUS_ID_KEY   = 'dc:analyticsAnonymousId';
const LEGACY_SESSION_KEY = 'dc:analyticsSessionId';
const SESSION_STATE_KEY  = 'dc:analyticsSessionState.v2';
export const ANALYTICS_SESSION_IDLE_MS = 20 * 60_000;

type SessionState = {
  id: string;
  lastActivityAt: number;
};

function readOrCreate(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}

function parseSessionState(raw: string | null): SessionState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (
      typeof parsed.id !== 'string'
      || parsed.id.length === 0
      || parsed.id.length > 128
      || typeof parsed.lastActivityAt !== 'number'
      || !Number.isFinite(parsed.lastActivityAt)
    ) return null;
    return { id: parsed.id, lastActivityAt: parsed.lastActivityAt };
  } catch {
    return null;
  }
}

// Long-lived — survives reloads and new browser sessions, distinct from the
// per-session ID below (§6.2 models these as two separate fields).
export function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return readOrCreate(window.localStorage, ANONYMOUS_ID_KEY);
  } catch {
    return null;
  }
}

// Session semantics deliberately mirror common product-analytics behavior:
// a browser tab gets a new session when it is first opened, and an existing
// tab rotates to a new session after 20 minutes without tracked activity.
// sessionStorage keeps separate tabs independent and disappears with the tab.
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  const now = Date.now();
  try {
    const raw = window.sessionStorage.getItem(SESSION_STATE_KEY);
    const state = parseSessionState(raw);
    if (
      state
      && now >= state.lastActivityAt
      && now - state.lastActivityAt <= ANALYTICS_SESSION_IDLE_MS
    ) {
      window.sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify({ ...state, lastActivityAt: now }));
      return state.id;
    }

    // One-time migration from the original tab-lifetime session ID. Reuse it
    // only when no v2 state exists; an expired v2 session must rotate.
    const migrated = raw === null ? window.sessionStorage.getItem(LEGACY_SESSION_KEY) : null;
    const id = migrated && migrated.length <= 128 ? migrated : crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_STATE_KEY, JSON.stringify({ id, lastActivityAt: now }));
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return id;
  } catch {
    try {
      return readOrCreate(window.sessionStorage, LEGACY_SESSION_KEY);
    } catch {
      return null;
    }
  }
}

export interface BrowserContext {
  browserFamily: string;
  browserMajor: string;
}

export function getBrowserContext(): BrowserContext {
  if (typeof navigator === 'undefined') return { browserFamily: '', browserMajor: '' };
  const ua = navigator.userAgent;

  const match =
    ua.match(/Edg\/(\d+)/) ??
    ua.match(/Chrome\/(\d+)/) ??
    ua.match(/Firefox\/(\d+)/) ??
    ua.match(/Version\/(\d+).*Safari/);

  if (ua.includes('Edg/'))     return { browserFamily: 'Edge',    browserMajor: match?.[1] ?? '' };
  if (ua.includes('Chrome'))   return { browserFamily: 'Chrome',  browserMajor: match?.[1] ?? '' };
  if (ua.includes('Firefox'))  return { browserFamily: 'Firefox', browserMajor: match?.[1] ?? '' };
  if (ua.includes('Safari'))   return { browserFamily: 'Safari',  browserMajor: match?.[1] ?? '' };
  return { browserFamily: 'Other', browserMajor: '' };
}

export interface DeviceContext {
  osFamily: 'Windows' | 'macOS' | 'Linux' | 'iOS' | 'Android' | 'Other';
  deviceCategory: 'desktop' | 'mobile' | 'tablet';
}

export function getDeviceContext(): DeviceContext {
  if (typeof navigator === 'undefined') return { osFamily: 'Other', deviceCategory: 'desktop' };
  const ua = navigator.userAgent;

  let osFamily: DeviceContext['osFamily'] = 'Other';
  if (/Windows/.test(ua))                osFamily = 'Windows';
  else if (/iPhone|iPad|iPod/.test(ua))  osFamily = 'iOS';
  else if (/Mac OS X/.test(ua))          osFamily = 'macOS';
  else if (/Android/.test(ua))           osFamily = 'Android';
  else if (/Linux/.test(ua))             osFamily = 'Linux';

  let deviceCategory: DeviceContext['deviceCategory'] = 'desktop';
  if (/iPad|Tablet/.test(ua))                              deviceCategory = 'tablet';
  else if (/Mobi|iPhone|Android.*Mobile/.test(ua))         deviceCategory = 'mobile';

  return { osFamily, deviceCategory };
}
