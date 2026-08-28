'use client';
// P0B-06: starts the IndexedDB analytics event queue once on mount — flush
// timers, online/visibilitychange listeners, and the trackEvent() transport
// swap (src/lib/analytics/eventFlush.ts). Rendered in the root layout so it
// covers every page, mirroring GlobalErrorHandler.tsx's exact pattern.
//
// Public-launch analytics: every client-side route change now emits the
// consent-gated `page_viewed` event. Acquisition metadata is intentionally
// limited to campaign/referrer labels (no full referrer URL or query-string
// capture), so the Admin analytics page can answer "where did visitors come
// from?" without collecting unnecessary browsing data.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalyticsQueue } from '@/lib/analytics/eventFlush';
import { trackEvent } from '@/lib/analytics/track';

const ACQUISITION_SESSION_KEY = 'dc.analytics.acquisition.v1';

type AcquisitionContext = {
  source: string;
  medium: string;
  campaign: string;
  referrerHost: string;
};

function safeReferrerHost(): string {
  if (typeof document === 'undefined' || !document.referrer) return 'direct';
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (!host || host === window.location.hostname.toLowerCase()) return 'direct';
    return host.slice(0, 160);
  } catch {
    return 'direct';
  }
}

function getAcquisitionContext(): AcquisitionContext {
  const fallback: AcquisitionContext = {
    source: 'direct',
    medium: '',
    campaign: '',
    referrerHost: safeReferrerHost(),
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const existing = window.sessionStorage.getItem(ACQUISITION_SESSION_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as Partial<AcquisitionContext>;
      return {
        source: typeof parsed.source === 'string' ? parsed.source : fallback.source,
        medium: typeof parsed.medium === 'string' ? parsed.medium : '',
        campaign: typeof parsed.campaign === 'string' ? parsed.campaign : '',
        referrerHost: typeof parsed.referrerHost === 'string' ? parsed.referrerHost : fallback.referrerHost,
      };
    }

    const params = new URLSearchParams(window.location.search);
    const referrerHost = fallback.referrerHost;
    const source = (params.get('utm_source') || (referrerHost !== 'direct' ? referrerHost : 'direct')).slice(0, 160);
    const context: AcquisitionContext = {
      source,
      medium: (params.get('utm_medium') || '').slice(0, 160),
      campaign: (params.get('utm_campaign') || '').slice(0, 240),
      referrerHost,
    };
    window.sessionStorage.setItem(ACQUISITION_SESSION_KEY, JSON.stringify(context));
    return context;
  } catch {
    return fallback;
  }
}

export function AnalyticsQueueInit() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalyticsQueue();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const acquisition = getAcquisitionContext();
    trackEvent('page_viewed', {
      route: pathname.slice(0, 2_000),
      acquisition_source: acquisition.source,
      acquisition_medium: acquisition.medium,
      acquisition_campaign: acquisition.campaign,
      referrer_host: acquisition.referrerHost,
    }, { section: 'navigation', component: 'route' });
  }, [pathname]);

  return null;
}
