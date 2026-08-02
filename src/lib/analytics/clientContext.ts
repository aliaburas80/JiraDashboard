// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: browser-local context for the analytics envelope (§6.2) —
// pseudonymous/session identity plus browser/OS/device detection.
// Promoted from FeedbackButton.tsx's inline getBrowserFamily() so both the
// feedback widget and the analytics SDK share one implementation.

const ANONYMOUS_ID_KEY = 'dc:analyticsAnonymousId';
const SESSION_ID_KEY   = 'dc:analyticsSessionId';

function readOrCreate(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}

// Long-lived — survives reloads and new browser sessions, distinct from the
// per-session ID below (§6.2 models these as two separate fields).
export function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null;
  return readOrCreate(window.localStorage, ANONYMOUS_ID_KEY);
}

// Resets whenever the browser session ends (tab/window close), unlike
// anonymous_id above.
export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return readOrCreate(window.sessionStorage, SESSION_ID_KEY);
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
  if (/Windows/.test(ua))           osFamily = 'Windows';
  else if (/iPhone|iPad|iPod/.test(ua)) osFamily = 'iOS';
  else if (/Mac OS X/.test(ua))     osFamily = 'macOS';
  else if (/Android/.test(ua))      osFamily = 'Android';
  else if (/Linux/.test(ua))        osFamily = 'Linux';

  let deviceCategory: DeviceContext['deviceCategory'] = 'desktop';
  if (/iPad|Tablet/.test(ua))                              deviceCategory = 'tablet';
  else if (/Mobi|iPhone|Android.*Mobile/.test(ua))          deviceCategory = 'mobile';

  return { osFamily, deviceCategory };
}
