// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Custom dashboard layout builder panel — reorder and show/hide sections.
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getLayoutPrefs,
  saveLayoutPrefs,
  resetLayoutPrefs,
  getDefaultLayout,
  moveUp,
  moveDown,
  toggleVisibility,
  type SectionPref,
} from '@/lib/layoutBuilder';
import { DASHBOARD_SECTIONS } from '@/lib/dashboardSections';

// ── Label / icon lookup ───────────────────────────────────────────────────────

const META: Record<string, { label: string; icon: string }> = Object.fromEntries(
  DASHBOARD_SECTIONS.map(s => [s.key, { label: s.label, icon: s.icon }])
);

// ── Panel ─────────────────────────────────────────────────────────────────────

interface Props {
  onLayoutChange: (prefs: SectionPref[]) => void;
}

export default function LayoutBuilderPanel({ onLayoutChange }: Props) {
  const [open,  setOpen]  = useState(false);
  const [prefs, setPrefs] = useState<SectionPref[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPrefs(getLayoutPrefs()); }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function apply(next: SectionPref[]) {
    setPrefs(next);
    saveLayoutPrefs(next);
    onLayoutChange(next);
  }

  function handleReset() {
    resetLayoutPrefs();
    const def = getDefaultLayout();
    setPrefs(def);
    onLayoutChange(def);
  }

  const visibleCount = prefs.filter(p => p.visible).length;
  const isDefault = prefs.every((p, i) => {
    const def = getDefaultLayout();
    return p.key === def[i]?.key && p.visible === def[i]?.visible;
  });

  return (
    <div ref={panelRef} className="relative print:hidden">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Customise dashboard layout"
        aria-label="Open layout builder"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
          <path d="M3 5h18v2H3V5Zm0 7h18v2H3v-2Zm0 7h18v2H3v-2Z"/>
        </svg>
        Layout
        {!isDefault && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-label="Custom layout active" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)',
            width: 280, maxHeight: '70vh',
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            zIndex: 999, display: 'flex', flexDirection: 'column',
          }}
          className="dark:bg-slate-800 dark:border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100">Layout Builder</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{visibleCount} of {prefs.length} sections visible</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={isDefault}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-700 mx-0" />

          {/* Section list */}
          <div className="overflow-y-auto flex-1 px-2 py-2">
            {prefs.map((pref, idx) => {
              const meta = META[pref.key];
              if (!meta) return null;
              return (
                <div
                  key={pref.key}
                  className={`flex items-center gap-2 px-2 py-2 rounded-xl mb-0.5 transition-colors ${pref.visible ? 'hover:bg-slate-50' : 'opacity-50 hover:bg-slate-50'}`}
                >
                  {/* Up/Down arrows */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => apply(moveUp(prefs, pref.key))}
                      disabled={idx === 0}
                      className="w-5 h-4 flex items-center justify-center text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
                      aria-label={`Move ${meta.label} up`}
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12 4 4 12h5v8h6v-8h5L12 4Z"/></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => apply(moveDown(prefs, pref.key))}
                      disabled={idx === prefs.length - 1}
                      className="w-5 h-4 flex items-center justify-center text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors rounded"
                      aria-label={`Move ${meta.label} down`}
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12 20 4 12h5V4h6v8h5L12 20Z"/></svg>
                    </button>
                  </div>

                  {/* Icon + label */}
                  <span className="text-base shrink-0" aria-hidden="true">{meta.icon}</span>
                  <span className={`flex-1 text-xs font-semibold min-w-0 truncate ${pref.visible ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                    {meta.label}
                  </span>

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => apply(toggleVisibility(prefs, pref.key))}
                    aria-label={pref.visible ? `Hide ${meta.label}` : `Show ${meta.label}`}
                    aria-pressed={pref.visible}
                    className="shrink-0"
                  >
                    <div
                      className="w-9 h-5 rounded-full transition-colors flex items-center"
                      style={{ background: pref.visible ? 'var(--dc-accent, #2563eb)' : '#cbd5e1', padding: '2px' }}
                    >
                      <div
                        className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                        style={{ transform: pref.visible ? 'translateX(16px)' : 'translateX(0)' }}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-[10px] text-slate-400 text-center">
              Changes apply to the section switcher and section visibility
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
