'use client';
// Global, consent-gated behavior instrumentation for the whole product.
// Mounted once in app/layout.tsx so every App Router page inherits it.
//
// Privacy rules: never capture typed text, form values, Jira issue content,
// filenames, query strings, share tokens or arbitrary DOM copy. Automatic
// labels are reduced to a small stable action vocabulary; richer labels must
// be explicitly supplied with data-analytics-label.
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalyticsQueue } from '@/lib/analytics/eventFlush';
import { getSessionId } from '@/lib/analytics/clientContext';
import { sanitizeAnalyticsPath, trackEvent } from '@/lib/analytics/track';

const ACQUISITION_SESSION_KEY = 'dc.analytics.acquisition.v1';
const MIN_ENGAGEMENT_MS = 1_000;
const MAX_ENGAGEMENT_MS = 30 * 60_000;
const RAGE_CLICK_WINDOW_MS = 2_000;
const RAGE_CLICK_THRESHOLD = 3;
const SCROLL_THRESHOLDS = [25, 50, 75, 90, 100] as const;

const INTERACTIVE_SELECTOR = [
  'button', 'a', 'input', 'select', 'textarea', 'summary',
  '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
  '[role="menuitemcheckbox"]', '[role="menuitemradio"]', '[role="option"]',
  '[role="checkbox"]', '[role="radio"]', '[role="switch"]',
  '[tabindex]:not([tabindex="-1"])', '[data-analytics-id]', '[data-analytics-track="true"]',
].join(',');

const SECTION_SELECTOR = '[data-analytics-section], main section[id], main [role="region"][id]';

const SAFE_ACTION_WORDS = new Set([
  'accept', 'add', 'analyze', 'analyse', 'apply', 'ask', 'back', 'cancel', 'clear',
  'close', 'compare', 'continue', 'copy', 'create', 'decline', 'delete', 'download',
  'edit', 'export', 'feedback', 'filter', 'help', 'home', 'login', 'logout', 'next',
  'open', 'previous', 'profile', 'refresh', 'remove', 'report', 'reset', 'retry',
  'run', 'save', 'search', 'select', 'send', 'settings', 'share', 'signup', 'start',
  'submit', 'toggle', 'try', 'upload', 'view', 'workspace', 'dashboard', 'intelligence',
  'forecast', 'trends', 'summary', 'teams', 'members', 'menu', 'tab', 'expand', 'collapse',
]);

const SENSITIVE_LABEL_PATTERN = /@|https?:\/\/|\b\d{4,}\b|\b[A-Z][A-Z0-9]{1,8}-\d+\b/i;
const SAFE_CONTROL_KEY = /^[A-Za-z][A-Za-z0-9:_-]{0,79}$/;
const SAFE_EXPLICIT_LABEL = /^[A-Za-z][A-Za-z0-9 _:/().,+&-]{0,79}$/;

type AnalyticsProperties = Record<string, string | number | boolean | null>;

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

function safeCampaignValue(raw: string | null, maxLength: number): string {
  if (!raw) return '';
  const value = raw.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  if (!value || SENSITIVE_LABEL_PATTERN.test(value)) return '';
  return /^[A-Za-z0-9 _./:+-]+$/.test(value) ? value : '';
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
        source: typeof parsed.source === 'string' ? safeCampaignValue(parsed.source, 160) || fallback.source : fallback.source,
        medium: typeof parsed.medium === 'string' ? safeCampaignValue(parsed.medium, 160) : '',
        campaign: typeof parsed.campaign === 'string' ? safeCampaignValue(parsed.campaign, 240) : '',
        referrerHost: typeof parsed.referrerHost === 'string' ? parsed.referrerHost.slice(0, 160) : fallback.referrerHost,
      };
    }

    const params = new URLSearchParams(window.location.search);
    const referrerHost = fallback.referrerHost;
    const source = safeCampaignValue(params.get('utm_source'), 160)
      || (referrerHost !== 'direct' ? referrerHost : 'direct');
    const context: AcquisitionContext = {
      source,
      medium: safeCampaignValue(params.get('utm_medium'), 160),
      campaign: safeCampaignValue(params.get('utm_campaign'), 240),
      referrerHost,
    };
    window.sessionStorage.setItem(ACQUISITION_SESSION_KEY, JSON.stringify(context));
    return context;
  } catch {
    return fallback;
  }
}

function safeExplicitLabel(raw: string | null): string {
  if (!raw) return '';
  const value = raw.replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!value || SENSITIVE_LABEL_PATTERN.test(value) || !SAFE_EXPLICIT_LABEL.test(value)) return '';
  return value;
}

function safeAutomaticLabel(raw: string | null): string {
  if (!raw) return '';
  const value = raw.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!value || SENSITIVE_LABEL_PATTERN.test(value)) return '';
  const words = value.toLowerCase().match(/[a-z]+/g) ?? [];
  const safeWords = words.filter(word => SAFE_ACTION_WORDS.has(word)).slice(0, 3);
  if (!safeWords.length) return '';
  return safeWords.map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(' ');
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
      if (url.origin === window.location.origin) {
        return { kind: 'route', target: sanitizeAnalyticsPath(url.pathname).slice(0, 2_000) };
      }
      return { kind: 'external', target: url.hostname.toLowerCase().slice(0, 160) };
    } catch {
      return { kind: 'link', target: '' };
    }
  }
  return { kind: 'action', target: '' };
}

function interactionLabel(element: Element): string {
  const explicit = safeExplicitLabel(element.getAttribute('data-analytics-label'));
  if (explicit) return explicit;

  const aria = safeAutomaticLabel(element.getAttribute('aria-label'));
  if (aria) return aria;
  const title = safeAutomaticLabel(element.getAttribute('title'));
  if (title) return title;

  if (element instanceof HTMLAnchorElement) {
    const target = targetFor(element);
    return target.kind === 'route' && target.target ? `Open ${target.target}` : target.kind;
  }

  const text = safeAutomaticLabel(element.textContent);
  if (text) return text;

  const key = safeControlKey(element);
  return key ? `Control ${key}` : 'Unlabeled action';
}

function isDisabled(element: Element): boolean {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  return element instanceof HTMLButtonElement || element instanceof HTMLInputElement
    ? element.disabled
    : false;
}

function clickPosition(event: MouseEvent): AnalyticsProperties {
  if (event.detail === 0 || typeof window === 'undefined') return { activation: 'keyboard' };

  const viewportWidth = Math.max(1, window.innerWidth);
  const viewportHeight = Math.max(1, window.innerHeight);
  const documentHeight = Math.max(viewportHeight, document.documentElement.scrollHeight || viewportHeight);
  const documentY = Math.max(0, window.scrollY + event.clientY);

  return {
    activation: 'pointer',
    viewport_x_pct: Math.round((Math.max(0, Math.min(viewportWidth, event.clientX)) / viewportWidth) * 100),
    viewport_y_pct: Math.round((Math.max(0, Math.min(viewportHeight, event.clientY)) / viewportHeight) * 100),
    document_y_pct: Math.round((Math.min(documentHeight, documentY) / documentHeight) * 100),
  };
}

function controlType(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  if (element instanceof HTMLInputElement) return element.type || 'text';
  if (element instanceof HTMLSelectElement) return element.multiple ? 'select-multiple' : 'select-one';
  return 'textarea';
}

function sectionKey(element: Element): string {
  const explicit = element.getAttribute('data-analytics-section');
  if (explicit && SAFE_CONTROL_KEY.test(explicit)) return explicit;
  return element.id && SAFE_CONTROL_KEY.test(element.id) ? element.id : '';
}

export function AnalyticsQueueInit() {
  const pathname = usePathname();
  const currentPathRef = useRef(pathname ? sanitizeAnalyticsPath(pathname) : '');
  const pageStartedAtRef = useRef(Date.now());
  const currentSessionRef = useRef<string | null>(null);
  const scrollDepthSeenRef = useRef<Set<number>>(new Set());
  const seenSectionsRef = useRef<Set<string>>(new Set());
  const rageClicksRef = useRef<Map<string, number[]>>(new Map());

  function ensureSessionStarted(trigger: string) {
    const sessionId = getSessionId();
    if (!sessionId || currentSessionRef.current === sessionId) return;
    currentSessionRef.current = sessionId;
    trackEvent('session_started', { trigger }, { section: 'lifecycle', component: 'session' });
  }

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

  function detectRageClick(element: Element, label: string) {
    const route = currentPathRef.current || '/';
    const identifier = safeControlKey(element) || label || element.tagName.toLowerCase();
    const key = `${route}::${identifier}`;
    const now = Date.now();
    const recent = (rageClicksRef.current.get(key) ?? []).filter(timestamp => now - timestamp <= RAGE_CLICK_WINDOW_MS);
    recent.push(now);

    if (recent.length >= RAGE_CLICK_THRESHOLD) {
      trackEvent('rage_click_detected', {
        route,
        label,
        control_key: safeControlKey(element),
        repeat_count: recent.length,
        window_ms: RAGE_CLICK_WINDOW_MS,
      }, {
        section: interactionSection(element),
        component: 'interaction',
        resultStatus: 'friction',
      });
      rageClicksRef.current.set(key, []);
      return;
    }
    rageClicksRef.current.set(key, recent);
  }

  useEffect(() => {
    initAnalyticsQueue();

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-analytics-ignore="true"]')) return;
      ensureSessionStarted('interaction');

      const interactive = event.target.closest(INTERACTIVE_SELECTOR);
      if (interactive && !isDisabled(interactive)) {
        const destination = targetFor(interactive);
        const label = interactionLabel(interactive);
        trackEvent('interaction_clicked', {
          element_type: interactive.tagName.toLowerCase(),
          label,
          control_key: safeControlKey(interactive),
          target_kind: destination.kind,
          target: destination.target,
          ...clickPosition(event),
        }, {
          section: interactionSection(interactive),
          component: 'interaction',
        });
        detectRageClick(interactive, label);
        return;
      }

      // Surface clicks capture charts, SVG marks, canvases and otherwise
      // non-semantic click targets. No DOM text/class names are recorded.
      trackEvent('surface_clicked', {
        element_type: event.target.tagName.toLowerCase().slice(0, 40),
        ...clickPosition(event),
      }, {
        section: interactionSection(event.target),
        component: 'surface',
      });
    };

    const handleChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
      if (target.closest('[data-analytics-ignore="true"]')) return;
      ensureSessionStarted('control_change');

      const properties: AnalyticsProperties = {
        element_type: target.tagName.toLowerCase(),
        control_type: controlType(target),
        control_key: safeControlKey(target),
        label: interactionLabel(target),
      };
      if (target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio')) {
        properties.checked = target.checked;
      }
      if (target instanceof HTMLSelectElement) properties.selected_count = target.selectedOptions.length;

      trackEvent('control_changed', properties, {
        section: interactionSection(target),
        component: 'control',
      });
    };

    const handleSubmit = (event: SubmitEvent) => {
      if (!(event.target instanceof HTMLFormElement)) return;
      const form = event.target;
      if (form.closest('[data-analytics-ignore="true"]')) return;
      ensureSessionStarted('form_submit');

      let targetKind = 'route';
      let target = currentPathRef.current || '/';
      try {
        const action = new URL(form.action || window.location.href, window.location.href);
        if (action.origin === window.location.origin) target = sanitizeAnalyticsPath(action.pathname);
        else {
          targetKind = 'external';
          target = action.hostname.toLowerCase().slice(0, 160);
        }
      } catch {
        targetKind = 'unknown';
        target = '';
      }

      trackEvent('form_submitted', {
        form_key: safeControlKey(form),
        method: (form.method || 'get').toLowerCase().slice(0, 12),
        target_kind: targetKind,
        target,
      }, {
        section: interactionSection(form),
        component: 'form',
      });
    };

    let scrollRaf = 0;
    const measureScroll = () => {
      scrollRaf = 0;
      const route = currentPathRef.current;
      if (!route) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const depth = Math.max(0, Math.min(100, Math.round((window.scrollY / maxScroll) * 100)));
      for (const threshold of SCROLL_THRESHOLDS) {
        if (depth < threshold || scrollDepthSeenRef.current.has(threshold)) continue;
        scrollDepthSeenRef.current.add(threshold);
        ensureSessionStarted('scroll');
        trackEvent('scroll_depth_reached', { route, depth_pct: threshold }, {
          section: 'navigation',
          component: 'scroll',
        });
      }
    };
    const handleScroll = () => {
      if (!scrollRaf) scrollRaf = window.requestAnimationFrame(measureScroll);
    };

    const intersectionObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
          const key = sectionKey(entry.target);
          const route = currentPathRef.current;
          if (!key || !route) continue;
          const unique = `${route}::${key}`;
          if (seenSectionsRef.current.has(unique)) continue;
          seenSectionsRef.current.add(unique);
          ensureSessionStarted('section');
          trackEvent('section_viewed', { route, section_key: key }, {
            section: key,
            component: 'section',
          });
        }
      }, { threshold: [0.5] })
      : null;

    const observeSections = (root: ParentNode) => {
      if (!intersectionObserver) return;
      root.querySelectorAll(SECTION_SELECTOR).forEach(element => intersectionObserver.observe(element));
    };
    observeSections(document);

    const mutationObserver = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            if (node.matches(SECTION_SELECTOR)) intersectionObserver?.observe(node);
            observeSections(node);
          }
        }
      })
      : null;
    mutationObserver?.observe(document.body, { childList: true, subtree: true });

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') recordEngagement('hidden');
      else {
        pageStartedAtRef.current = Date.now();
        ensureSessionStarted('resume');
      }
    };
    const handlePageHide = () => recordEngagement('pagehide');

    document.addEventListener('click', handleClick, true);
    document.addEventListener('change', handleChange, true);
    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('change', handleChange, true);
      document.removeEventListener('submit', handleSubmit, true);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handlePageHide);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      mutationObserver?.disconnect();
      intersectionObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const safePath = sanitizeAnalyticsPath(pathname);
    if (currentPathRef.current && currentPathRef.current !== safePath) {
      recordEngagement('route_change');
    }
    currentPathRef.current = safePath;
    pageStartedAtRef.current = Date.now();
    scrollDepthSeenRef.current = new Set();
    seenSectionsRef.current = new Set();
    rageClicksRef.current.clear();
    ensureSessionStarted('page');

    const acquisition = getAcquisitionContext();
    trackEvent('page_viewed', {
      route: safePath.slice(0, 2_000),
      acquisition_source: acquisition.source,
      acquisition_medium: acquisition.medium,
      acquisition_campaign: acquisition.campaign,
      referrer_host: acquisition.referrerHost,
    }, { section: 'navigation', component: 'route' });
  }, [pathname]);

  return null;
}
