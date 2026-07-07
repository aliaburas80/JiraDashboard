// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Super-admin-only control for the soft-launch "Persona Preview" dashboard
// switcher (src/components/dashboard/PersonaPreviewSwitcher.tsx). This panel
// itself is only reachable by an admin, but the underlying POST endpoint
// re-checks isSuperAdmin server-side — a regular admin landing here via a
// stale tab reference still can't actually toggle it.

'use client';
import { useEffect, useState } from 'react';
import { PERSONA_FOCUS_LIST } from '@/config/personaFocus.config';
import { SvgIcon } from '@/components/ui/SvgIcon';

export default function PersonaPreviewPanel() {
  const [enabled, setEnabled]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetch('/api/admin/persona-preview')
      .then(r => r.json())
      .then(data => setEnabled(data?.settings?.enabled === true))
      .catch(() => setError('Could not load the current setting.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle() {
    const next = !enabled;
    setSaving(true);
    setError('');
    try {
      const res  = await fetch('/api/admin/persona-preview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enabled: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not save this setting.');
        return;
      }
      setEnabled(next);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-400 animate-pulse">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-black text-slate-900 mb-1">Persona Preview Switcher</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          A soft-launch dashboard control that lets any signed-in user preview which pages best
          answer a given professional role&apos;s questions (Scrum Master, Product Owner, Project
          Manager, Engineering Manager, Executive). It is purely presentational — selecting a
          persona never changes what data a user can access. Only the super-admin can show or
          hide it for everyone.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={enabled ? 'btn-danger' : 'btn-primary'}
        >
          <SvgIcon name={enabled ? 'eyeOff' : 'eye'} size={14} />
          {saving ? 'Saving…' : enabled ? 'Hide for everyone' : 'Show for everyone'}
        </button>

        <p className="text-xs text-slate-400 mt-3">
          Currently <strong>{enabled ? 'visible' : 'hidden'}</strong> on every dashboard page&apos;s topbar.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-700 mb-3">What each persona highlights</h3>
        <ul className="space-y-3">
          {PERSONA_FOCUS_LIST.map(focus => (
            <li key={focus.persona} className="text-sm">
              <span className="font-bold text-slate-800">{focus.persona}</span>
              <span className="text-slate-400"> — {focus.focusAreas.map(a => a.title).join(', ')}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 mt-3">
          Edit <code className="font-mono">src/config/personaFocus.config.ts</code> to change what each persona highlights.
        </p>
      </div>
    </div>
  );
}
