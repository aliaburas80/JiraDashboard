// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-05: envelope construction for the product-event taxonomy (§6.2).
// This module builds and consent-gates events — it does not deliver them.
// Delivery (IndexedDB batching, flush thresholds, server ack/dedup) is
// P0B-06/P0B-07; the default transport below is an inert dev-only stub so
// this SDK is fully usable and testable ahead of that pipeline existing.

import packageJson from '../../../package.json';
import { getCachedUser } from '@/lib/currentUser';
import { getAnalyticsConsent } from './consentGate';
import { getAnonymousId, getSessionId, getBrowserContext, getDeviceContext } from './clientContext';
import { isAnalyticsEventName, type AnalyticsEventName } from './eventTaxonomy';

export interface AnalyticsEvent {
  event_id: string;
  schema_version: 1;
  event_name: AnalyticsEventName;
  occurred_at: string;
  user_id: string | null;
  anonymous_id: string | null;
  session_id: string | null;
  page: string;
  section: string | null;
  component: string | null;
  app_version: string;
  role: string | null;
  browser_family: string;
  browser_major: string;
  os_family: string;
  device_category: string;
  result_status: string | null;
  duration_ms: number | null;
  properties: Record<string, string | number | boolean | null>;
}

export type AnalyticsTransport = (event: AnalyticsEvent) => void;

const devLogTransport: AnalyticsTransport = (event) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event);
  }
};

let transport: AnalyticsTransport = devLogTransport;

/** Override point for tests and, later, P0B-06's real IndexedDB-batched transport. */
export function configureAnalyticsTransport(next: AnalyticsTransport): void {
  transport = next;
}

export interface TrackEventContext {
  section?:     string;
  component?:   string;
  resultStatus?: string;
  durationMs?:  number;
}

function buildEnvelope(
  name: AnalyticsEventName,
  properties: Record<string, string | number | boolean | null>,
  context: TrackEventContext,
): AnalyticsEvent {
  const user = getCachedUser();
  const browser = getBrowserContext();
  const device  = getDeviceContext();

  return {
    event_id:       crypto.randomUUID(),
    schema_version: 1,
    event_name:     name,
    occurred_at:    new Date().toISOString(),
    user_id:        user?.userId ?? null,
    anonymous_id:   getAnonymousId(),
    session_id:     getSessionId(),
    page:           typeof window !== 'undefined' ? window.location.pathname : '',
    section:        context.section ?? null,
    component:      context.component ?? null,
    app_version:    packageJson.version,
    role:           user?.role ?? null,
    browser_family: browser.browserFamily,
    browser_major:  browser.browserMajor,
    os_family:      device.osFamily,
    device_category: device.deviceCategory,
    result_status:  context.resultStatus ?? null,
    duration_ms:    context.durationMs ?? null,
    properties,
  };
}

/**
 * Consent-gated, fire-and-forget. Drops the event (never queues/retries) when
 * consent isn't granted or the name isn't in the taxonomy — analytics is
 * inherently best-effort, and P0B-06 owns real retry/durability semantics.
 */
export function trackEvent(
  name: AnalyticsEventName,
  properties: Record<string, string | number | boolean | null> = {},
  context: TrackEventContext = {},
): void {
  if (!isAnalyticsEventName(name)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[analytics] dropped unknown event name: ${name}`);
    }
    return;
  }

  void getAnalyticsConsent().then(granted => {
    if (!granted) return;
    transport(buildEnvelope(name, properties, context));
  });
}
