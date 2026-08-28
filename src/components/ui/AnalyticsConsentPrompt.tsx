'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { fetchCurrentUser, getCachedUser } from '@/lib/currentUser';
import {
  getAnonymousAnalyticsConsentDecision,
  sanitizeAnalyticsPath,
  setAnalyticsConsentCache,
  setAnonymousAnalyticsConsent,
  trackEvent,
} from '@/lib/analytics';

type PromptMode = 'anonymous' | 'account' | null;

function safeAcquisitionValue(raw: string | null): string {
  if (!raw) return '';
  const value = raw.replace(/\s+/g, ' ').trim().slice(0, 160);
  if (!value || /@|https?:\/\/|\b\d{4,}\b/i.test(value)) return '';
  return /^[A-Za-z0-9 _./:+-]+$/.test(value) ? value : '';
}

function currentAcquisitionSource(): string {
  if (typeof window === 'undefined') return 'direct';
  try {
    const params = new URLSearchParams(window.location.search);
    const explicit = safeAcquisitionValue(params.get('utm_source'));
    if (explicit) return explicit;
    if (!document.referrer) return 'direct';
    const referrer = new URL(document.referrer);
    return referrer.hostname === window.location.hostname ? 'direct' : referrer.hostname.slice(0, 160);
  } catch {
    return 'direct';
  }
}

function recordCurrentPageAfterGrant(): void {
  if (typeof window === 'undefined') return;
  trackEvent('page_viewed', {
    route: sanitizeAnalyticsPath(window.location.pathname).slice(0, 2_000),
    acquisition_source: currentAcquisitionSource(),
    consent_activation: true,
  }, { section: 'navigation', component: 'consent' });
}

export function AnalyticsConsentPrompt() {
  const pathname = usePathname();
  const [mode, setMode] = useState<PromptMode>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function resolvePrompt() {
      setError('');

      const cached = getCachedUser();
      const user = cached ?? await fetchCurrentUser();
      if (cancelled) return;

      if (!user) {
        const anonymousDecision = getAnonymousAnalyticsConsentDecision();
        setMode(anonymousDecision === null ? 'anonymous' : null);
        return;
      }

      try {
        const response = await fetch('/api/consent', { cache: 'no-store' });
        if (!response.ok) {
          setMode(null);
          return;
        }
        const body = await response.json();
        const analytics = body?.consent?.analytics;
        if (analytics?.decided === true) {
          setAnalyticsConsentCache(analytics.granted === true);
          setMode(null);
        } else {
          // A signed-in choice is separate from an earlier anonymous browser
          // choice because account-linked analytics deserves an explicit opt-in.
          setMode('account');
        }
      } catch {
        setMode(null);
      }
    }

    void resolvePrompt();
    return () => { cancelled = true; };
  }, [pathname]);

  async function decide(granted: boolean) {
    if (!mode || saving) return;
    setSaving(true);
    setError('');

    try {
      if (mode === 'account') {
        const response = await fetch('/api/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'analytics', granted }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? 'Could not save your analytics preference.');
        setAnalyticsConsentCache(body?.consent?.analytics?.granted === true);
        // Keep the browser's logged-out/anonymous preference aligned with the
        // explicit choice this person just made on this device.
        setAnonymousAnalyticsConsent(granted);
      } else {
        setAnonymousAnalyticsConsent(granted);
      }

      setMode(null);
      if (granted) recordCurrentPageAfterGrant();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your analytics preference.');
    } finally {
      setSaving(false);
    }
  }

  if (!mode) return null;

  return (
    <aside
      data-analytics-ignore="true"
      className="fixed bottom-4 left-1/2 z-[120] w-[min(94vw,760px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5"
      aria-label="Analytics preference"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900">Help us improve Delivery Clarity</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Share optional product-usage analytics such as pages visited, clicks, control actions, scroll depth, timing and errors.
            We do not collect Jira issue content, typed text, filenames, form values or private link tokens.{' '}
            <Link href="/privacy" className="font-bold text-blue-600 hover:underline">Privacy details</Link>
          </p>
          {mode === 'account' ? (
            <p className="mt-1 text-[11px] text-slate-500">Your choice is saved to your account and can be changed anytime in Settings → Privacy.</p>
          ) : null}
          {error ? <p className="mt-2 text-xs font-bold text-red-600" role="alert">{error}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void decide(false)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            No thanks
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void decide(true)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Allow analytics'}
          </button>
        </div>
      </div>
    </aside>
  );
}
