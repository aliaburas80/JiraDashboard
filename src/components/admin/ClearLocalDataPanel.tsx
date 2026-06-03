// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasLocalData, clearLocalData, DC_FIXED_KEYS } from '@/lib/clearLocalData';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

export default function ClearLocalDataPanel() {
  const router = useRouter();
  const [detected, setDetected]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared]       = useState(false);

  useEffect(() => { setDetected(hasLocalData()); }, []);

  function handleConfirm() {
    clearLocalData();
    setConfirming(false);
    setDetected(false);
    setCleared(true);
    // Redirect after short delay so user sees the success message
    setTimeout(() => router.push('/'), 1800);
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-black text-slate-900 mb-1">Browser Data</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          Delivery Clarity stores your uploaded data and preferences in this browser&apos;s
          local storage. Use this option to remove that data — for example when switching
          accounts or clearing sensitive information. Server-side import logs are not affected.
        </p>

        {cleared ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-semibold">
            <span className="text-lg">✅</span>
            Local data cleared. Redirecting to upload page…
          </div>
        ) : detected ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="text-lg shrink-0">⚠️</span>
              <p className="leading-snug">
                <strong>Stored Delivery Clarity data was found in this browser.</strong><br />
                This includes uploaded metrics, saved filters, preferences, and session data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="btn-danger"
            >
              <span>🗑️</span> Clear Local Data
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
            <span className="text-lg">✓</span>
            No Delivery Clarity data found in this browser.
          </div>
        )}
      </div>

      {/* Key inventory — always visible for transparency */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-700 mb-2">Keys managed by this action</h3>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
          {DC_FIXED_KEYS.map(k => (
            <li key={k} className="text-xs font-mono text-slate-500">{k}</li>
          ))}
          <li className="text-xs font-mono text-slate-400 italic">dc_col_order_* (dynamic)</li>
        </ul>
        <p className="text-xs text-slate-400 mt-3">Server-side import history and database records are not removed.</p>
      </div>

      {confirming && (
        <ConfirmDeleteDialog
          title="Clear Local Data?"
          message="This will remove local data and may end your current session. You may need to log in again."
          confirmLabel="Yes, clear it"
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
