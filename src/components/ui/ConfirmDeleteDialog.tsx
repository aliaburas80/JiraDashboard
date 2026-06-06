// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Reusable confirmation dialog for destructive actions.
'use client';
import { useEffect, useRef } from 'react';

interface Props {
  title:       string;
  message:     string;
  confirmLabel?: string;
  onConfirm:   () => void;
  onCancel:    () => void;
  loading?:    boolean;
  danger?:     boolean;
}

export default function ConfirmDeleteDialog({
  title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading = false, danger = true,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button and handle Escape
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl shrink-0">{danger ? '🗑️' : '⚠️'}</span>
          <div>
            <h2 id="confirm-title" className="text-base font-black text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1 leading-snug">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
