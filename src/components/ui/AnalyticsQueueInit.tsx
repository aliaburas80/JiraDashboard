'use client';
// P0B-06: starts the IndexedDB analytics queue and records consent-gated,
// privacy-minimised product navigation signals across the whole app.
//
// Public-launch analytics deliberately avoids form values, typed text, Jira
// issue content, filenames, query strings and arbitrary DOM text. Click labels
// come only from explicit analytics/ARIA metadata or a conservative set of
// static product-action words.
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalyticsQueue } from '@/lib/analytics/eventFlush';
import { trackEvent } from '@/lib/analytics/track';

const ACQUISITION_SESSION_KEY = 'dc.analytics.acquisition.v1';
const MIN_ENGAGEMENT_MS = 1_000;
const MAX_ENGAGEMENT_MS = 30 * 60_000;

const SAFE_ACTION_WORDS = new Set([
  'add', 'analyze', 'analyse', 'apply', 'ask', 'back', 'cancel', 'clear', 'close',
  'compare', 'continue', 'copy', 'create', 'delete', 'download', 'edit', 'export',
  'feedback', 'filter', 'help', 'home', 'login', 'logout', 'next', 'open', 'profile',
  'refresh', 'remove', 'report', 'reset', 'retry', 'run', 'save', 'search', 'send',
  'settings', 'share', 'signup', 'start', 'submit', 'try', 'upload', 'view', 'workspace',
  'dashboard', 'intelligence', 'forecast', 'trends', 'summary', 'teams', 'members',
]);

const SENSITIVE_LABEL_PATTERN = /@|https?:\/\/|\b\d{4,}\b|\b[A-Z][A-Z0-9]{1,8}-\d+\b/i;
const SAFE_CONTROL_KEY = /^[A-Za-z][A-Za-z0-9:_-]{0,79}$/;

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

function safeProductLabel(raw: string | null): string {
  if (!raw) return '';
  const value = raw.replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!value || SENSITIVE_LABEL_PATTERN.test(value)) return '';
  const words = value.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.some(word => SAFE_ACTION_WORDS.has(word)) ? value : '';
}

function safeControlKey(element: Element): string {
  const candidates = [
    element.getAttribute('data-analytics-id'),
    element.getAttribute('name'),
    element.id,
  ];
  for (const candidate of candidates) {
    if (candidate && SAFE_CONTROL_KEY.test(candidate)) return candidate;
  }
  return '';
}

function interactionSection(element: Element): string {
  const explicit = element.closest('[data-analytics-section]')?.getAttribute('data-analytics-section');
  if (explicit && SAFE_CONTROL_KEY.test(explicit)) return explicit;
  const landmark = element.closest('nav,header,main,aside,footer,form');
  return landmark?.tagName.toLowerCase() ?? 'content';
}

function targetFor(element: Element): { kind: string; target: string } {
  if (element instanceof HTMLAnchorElement && element.href) {
    try {
      const url = new URL(element.href, window.location.href);
      if (url.origin === window.location.origin) return { kind: 'route', target: url.pathname.slice(0, 2_000) };
      return { kind: 'external', target: url.hostname.toLowerCase().slice(0, 160) };
    } catch {
      return { kind: 'link', target: '' };
    }
  }
  return { kind: 'action', target: '' };
}

function interactionLabel(element: Element): string {
  const explicit = safeProductLabel(element.getAttribute('data-analytics-label'));
  if (explicit) return explicit;
  const aria = safeProductLabel(element.getAttribute('aria-label'));
  if (aria) return aria;
  const title = safeProductLabel(element.getAttribute('title'));
  if (title) return title;

  if (element instanceof HTMLAnchorElement) {
    const target = targetFor(element);
    return target.kind === 'route' && target.target ? `Open ${target.target}` : target.kind;
  }

  const text = safeProductLabel(element.textContent);
  return text || 'Unlabeled action';
}

export function AnalyticsQueueInit() {
  const pathname = usePathname();
  const currentPathRef = useRef(pathname ?? '');
  const pageStartedAtRef = useRef(Date.now());

  function recordEngagement(reason: string) {
    const route = currentPathRef.current;
    if (!route) return;
    const now = Date.now();
    const durationMs = Math.min(MAX_ENGAGEMENT_MS, Math.max(0, now - pageStartedAtRef.current));
    pageStartedAtRef.current = now;
    if (durationMs < MIN_ENGAGEMENT_MS) return;
    trackEvent('page_engaged', { route, reason }, {
      section: 'navigation',
      component: 'route',
      durationMs,
    });
  }

  useEffect(() => {
    initAnalyticsQueue();

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const interactive = event.target.closest('button,a,[role="button"],[role="link"]');
      if (!interactive || interactive.closest('[data-analytics-ignore="true"]')) return;
      if (interactive.getAttribute('aria-disabled') === 'true') return;
      if (interactive instanceof HTMLButtonElement && interactive.disabled) return;

      const destination = targetFor(interactive);
      trackEvent('interaction_clicked', {
        element_type: interactive.tagName.toLowerCase(),
        label: interactionLabel(interactive),
        control_key: safeControlKey(interactive),
        target_kind: destination.kind,
        target: destination.target,
      }, {
        section: interactionSection(interactive),
        component: 'interaction',
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') recordEngagement('hidden');
      else pageStartedAtRef.current = Date.now();
    };
    const handlePageHide = () => recordEngagement('pagehide');

    document.addEventListener('click', handleClick, true);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (currentPathRef.current && currentPathRef.current !== pathname) {
      recordEngagement('route_change');
    }
    currentPathRef.current = pathname;
    pageStartedAtRef.current = Date.now();

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
