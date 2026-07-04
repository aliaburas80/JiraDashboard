// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Client-side error reporter (P0B-08).
// Sends structured error payloads to POST /api/events/error for storage.
// Never attaches cookies, tokens, Jira data, or form values.

interface ErrorPayload {
  message:       string;
  stack?:        string;
  page?:         string;
  component?:    string;
  severity?:     'error' | 'warning' | 'critical';
  browserFamily?: string;
}

function getBrowserFamily(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome'))  return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari'))  return 'Safari';
  if (ua.includes('Edge'))    return 'Edge';
  return 'Other';
}

export async function reportError(payload: ErrorPayload): Promise<void> {
  if (typeof window === 'undefined') return; // server-side — skip
  try {
    await fetch('/api/events/error', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message:       payload.message.slice(0, 500),
        stack:         payload.stack?.slice(0, 3000),
        page:          payload.page ?? window.location.pathname,
        component:     payload.component ?? '',
        severity:      payload.severity ?? 'error',
        browserFamily: payload.browserFamily ?? getBrowserFamily(),
      }),
      // keepalive so the request survives page unloads
      keepalive: true,
    });
  } catch {
    // Reporting must never crash the app itself.
  }
}

// Wire up global unhandled error and promise rejection handlers.
// Call this once from the root client layout.
export function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    reportError({
      message:   event.message || 'Unhandled error',
      stack:     event.error?.stack,
      page:      window.location.pathname,
      component: 'window.onerror',
      severity:  'error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error
      ? reason.message
      : String(reason ?? 'Unhandled promise rejection');
    reportError({
      message,
      stack:     reason instanceof Error ? reason.stack : undefined,
      page:      window.location.pathname,
      component: 'unhandledrejection',
      severity:  'error',
    });
  });
}
