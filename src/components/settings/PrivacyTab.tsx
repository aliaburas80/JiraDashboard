// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ConsentStatus {
  termsAndPrivacy: { granted: boolean; version: string; acceptedAt: string | null };
  analytics:       { granted: boolean; version: string; updatedAt: string | null; decided: boolean };
}

interface PrivacyTabProps {
  onToast: (msg: string) => void;
}

export default function PrivacyTab({ onToast }: PrivacyTabProps) {
  const [consent, setConsent] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/consent').then(r => r.ok ? r.json() : null).catch(() => null)
      .then(data => { if (data?.consent) setConsent(data.consent); })
      .finally(() => setLoading(false));
  }, []);

  async function toggleAnalytics(granted: boolean) {
    setSaving(true);
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'analytics', granted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not update your preference.');
      setConsent(data.consent);
      onToast(granted ? 'Analytics sharing enabled.' : 'Analytics sharing disabled.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Failed to update your preference.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !consent) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm italic text-slate-400">Loading your privacy settings…</p>
      </section>
    );
  }

  const acceptedDate = consent.termsAndPrivacy.acceptedAt
    ? new Date(consent.termsAndPrivacy.acceptedAt).toLocaleDateString()
    : null;

  return (
    <>
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-black uppercase tracking-wider text-slate-700">Terms & Privacy</h2>
        <p className="mb-4 text-xs text-slate-500">
          {consent.termsAndPrivacy.version
            ? `You accepted version ${consent.termsAndPrivacy.version}${acceptedDate ? ` on ${acceptedDate}` : ''}.`
            : 'You accepted our Terms of Use and Privacy Policy at registration.'}
          {' '}Read the current <Link href="/terms" target="_blank" className="font-semibold text-blue-600 hover:underline">Terms of Use</Link>
          {' '}and <Link href="/privacy" target="_blank" className="font-semibold text-blue-600 hover:underline">Privacy Policy</Link>.
        </p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          These terms are required to use Delivery Clarity and can&apos;t be withdrawn while keeping your account active.
          To withdraw consent, email <a href="mailto:ali.aburas@deliveryclarity.app" className="font-semibold text-blue-600 hover:underline">ali.aburas@deliveryclarity.app</a> to request account deletion.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-black uppercase tracking-wider text-slate-700">Analytics</h2>
        <p className="mb-4 text-xs text-slate-500">
          Optionally share anonymous product-usage analytics to help us improve Delivery Clarity.
          We don&apos;t currently collect product analytics — this preference will be honored once we do.
        </p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={consent.analytics.granted}
            disabled={saving}
            onChange={e => toggleAnalytics(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm font-semibold text-slate-800">
            Share anonymous usage analytics
          </span>
        </label>
        {!consent.analytics.decided && (
          <p className="mt-2 text-[11px] italic text-slate-400">You haven&apos;t made a choice yet — currently treated as not shared.</p>
        )}
      </section>
    </>
  );
}
