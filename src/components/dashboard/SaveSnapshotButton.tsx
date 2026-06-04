// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Inline "Save Snapshot" button — appears on the dashboard sticky bar.
'use client';
import { useState } from 'react';
import type { DashboardMetrics } from '@/types/metrics';

interface Props {
  metrics: DashboardMetrics;
}

export default function SaveSnapshotButton({ metrics }: Props) {
  const [open, setOpen]       = useState(false);
  const [name, setName]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Check login state once on first open
  async function handleOpen() {
    if (isLoggedIn === null) {
      const r = await fetch('/api/auth/me').catch(() => null);
      setIsLoggedIn(!!r?.ok);
    }
    setOpen(o => !o);
    setMsg('');
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/snapshots', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ snapshotName: name.trim(), metricsJson: JSON.stringify(metrics) }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? 'Save failed.'); return; }
      setMsg('✓ Snapshot saved!');
      setName('');
      setTimeout(() => { setOpen(false); setMsg(''); }, 1800);
    } catch { setMsg('Save failed. Please try again.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        title="Save current dashboard as a named snapshot"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          minHeight: 44, minWidth: 'max-content',
          padding: '6px 10px', borderRadius: 12,
          border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, lineHeight: 1, fontFamily: 'inherit',
          color: '#334155', background: 'transparent',
          transition: 'background 180ms ease',
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 12, height: 12, fill: 'none', stroke: '#64748b', strokeWidth: 2.5, flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Save snapshot
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 w-72">
          {isLoggedIn === false ? (
            <div>
              <p className="text-xs font-bold text-slate-800 mb-1">Sign in to save snapshots</p>
              <p className="text-xs text-slate-500 mb-3">Snapshots are saved to your account so you can access them later.</p>
              <a href="/login" className="block w-full text-center py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                Sign in
              </a>
            </div>
          ) : (
            <div>
              <p className="text-xs font-black text-slate-800 mb-1">Save dashboard snapshot</p>
              <p className="text-xs text-slate-400 mb-3">
                Saves current metrics as a named point-in-time report (e.g. "End of Sprint 14").
              </p>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setOpen(false);
                }}
                placeholder="e.g. End of Sprint 14"
                maxLength={60}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
              />
              {/* Quick name suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['End of Sprint', 'Bi-weekly Review', 'Release Checkpoint', 'Q2 Snapshot'].map(s => (
                  <button key={s} type="button" onClick={() => setName(s)}
                    className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className="flex-1 py-2 btn-primary text-xs"
                >
                  {saving ? 'Saving…' : 'Save snapshot'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="btn-ghost text-xs px-3 py-2">
                  Cancel
                </button>
              </div>
              {msg && (
                <p className={`text-xs mt-2 font-semibold text-center ${msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {msg}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
