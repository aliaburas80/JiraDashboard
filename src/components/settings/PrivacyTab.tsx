// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { setAnalyticsConsentCache, setAnonymousAnalyticsConsent } from '@/lib/analytics';

interface ConsentStatus {
  termsAndPrivacy: { granted: boolean; version: string; acceptedAt: string | null };
  analytics:       { granted: boolean; version: string; updatedAt: string | null; decided: boolean };
}

interface PrivacyTabProps {
  onToast: (msg: string) => void;
}

export default function PrivacyTab({ onToast }: PrivacyTabProps) {
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

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
      setAnalyticsConsentCache(data.consent.analytics.granted);
      setAnonymousAnalyticsConsent(data.consent.analytics.granted);
      onToast(granted ? 'Analytics sharing enabled.' : 'Analytics sharing disabled.');
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Failed to update your preference.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new Error('Could not export your data.');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `delivery-clarity-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Failed to export your data.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleteError('');
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? 'Could not delete your account.');
        return;
      }
      router.push('/login');
      router.refresh();
    } catch {
      setDeleteError('Network error. Please try again.');
    } finally {
      setDeleting(false);
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
          To withdraw consent, delete your account below, or email <a href="mailto:ali.aburas@deliveryclarity.app" className="font-semibold text-blue-600 hover:underline">ali.aburas@deliveryclarity.app</a> if you&apos;re unable to use self-service deletion.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-black uppercase tracking-wider text-slate-700">Analytics</h2>
        <p className="mb-4 text-xs text-slate-500">
          Optionally share privacy-minimised product-usage analytics to help us improve Delivery Clarity.
          When enabled, we record product pages, product actions, timing and error signals. We do not record Jira issue content,
          typed text, filenames or form values. You can change this choice at any time.
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
            Share product-usage analytics
          </span>
        </label>
        {!consent.analytics.decided && (
          <p className="mt-2 text-[11px] italic text-slate-400">You haven&apos;t made a choice yet — analytics remains off until you opt in.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-black uppercase tracking-wider text-slate-700">Your Data</h2>
        <p className="mb-4 text-xs text-slate-500">
          Download everything Delivery Clarity has stored about your account, or permanently delete your account.
        </p>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary mb-4 disabled:opacity-50"
        >
          {exporting ? 'Preparing export…' : 'Export my data'}
        </button>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="mb-1 text-xs font-black uppercase tracking-wider text-red-700">Delete my account</h3>
          {!showDeleteForm ? (
            <>
              <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
                Your account is locked immediately and permanently deleted 7 days later. An administrator can
                cancel this within that window if you change your mind or contact support.
              </p>
              <button type="button" onClick={() => setShowDeleteForm(true)} className="btn-outline-danger btn-sm">
                Delete my account
              </button>
            </>
          ) : (
            <div className="max-w-sm">
              <label className="mb-2 grid gap-2 text-xs font-extrabold text-slate-700">
                Confirm your password
                <PasswordInput
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-red-400"
                />
              </label>
              {deleteError && <p className="mb-2 text-xs font-semibold text-red-600">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || !deletePassword}
                  className="btn-outline-danger btn-sm disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Permanently delete my account'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteForm(false); setDeletePassword(''); setDeleteError(''); }}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
