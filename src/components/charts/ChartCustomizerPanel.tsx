// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Chart customizer panel — order, visibility, and column span per chart.
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CHART_REGISTRY,
  getChartPrefs,
  saveChartPrefs,
  resetChartPrefs,
  getDefaultChartPrefs,
  isDefaultChartPrefs,
  chartMoveUp,
  chartMoveDown,
  chartToggleVisible,
  chartSetSpan,
  type ChartPref,
  type ChartSpan,
} from '@/lib/chartCustomizer';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './ChartCustomizerPanel.module.scss';

interface Props {
  onPrefsChange: (prefs: ChartPref[]) => void;
}

const META = Object.fromEntries(CHART_REGISTRY.map(c => [c.id, c]));

export default function ChartCustomizerPanel({ onPrefsChange }: Props) {
  const [open,  setOpen]  = useState(false);
  const [prefs, setPrefs] = useState<ChartPref[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPrefs(getChartPrefs()); }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function apply(next: ChartPref[]) {
    setPrefs(next);
    saveChartPrefs(next);
    onPrefsChange(next);
  }

  function handleReset() {
    resetChartPrefs();
    const def = getDefaultChartPrefs();
    setPrefs(def);
    onPrefsChange(def);
  }

  const visibleCount = prefs.filter(p => p.visible).length;
  const isDefault    = isDefaultChartPrefs(prefs);

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Customise charts"
        aria-label="Open chart customizer"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-sm"
      >
        <SvgIcon name="customize" size={14} />
        Customise
        {!isDefault && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
      </button>

      {/* Panel */}
      {open && (
        <div className={styles.panel}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-xs font-black text-slate-800">Chart Customiser</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{visibleCount} of {prefs.length} charts visible</p>
            </div>
            <button type="button" onClick={handleReset} disabled={isDefault}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors">
              Reset
            </button>
          </div>

          <div className="h-px bg-slate-100 mx-0" />

          {/* Chart list */}
          <div className="overflow-y-auto flex-1 px-2 py-2">
            {prefs.map((pref, idx) => {
              const meta = META[pref.id];
              if (!meta) return null;
              return (
                <div key={pref.id}
                  className={`px-2 py-2 rounded-xl mb-0.5 transition-colors ${pref.visible ? 'hover:bg-slate-50' : 'opacity-50 hover:bg-slate-50'}`}
                >
                  {/* Row 1: arrows + icon + label + toggle */}
                  <div className="flex items-center gap-2">
                    {/* Up/down */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button type="button" onClick={() => apply(chartMoveUp(prefs, pref.id))}
                        disabled={idx === 0}
                        className="w-5 h-4 flex items-center justify-center text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed rounded"
                        aria-label={`Move ${meta.label} up`}>
                        <SvgIcon name="arrowUp" size={12} />
                      </button>
                      <button type="button" onClick={() => apply(chartMoveDown(prefs, pref.id))}
                        disabled={idx === prefs.length - 1}
                        className="w-5 h-4 flex items-center justify-center text-slate-300 hover:text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed rounded"
                        aria-label={`Move ${meta.label} down`}>
                        <SvgIcon name="arrowDown" size={12} />
                      </button>
                    </div>
                    <SvgIcon name={meta.icon} size={16} className="text-slate-500" />
                    <span className={`flex-1 text-xs font-semibold truncate ${pref.visible ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {meta.label}
                    </span>
                    {/* Toggle */}
                    <button type="button"
                      onClick={() => apply(chartToggleVisible(prefs, pref.id))}
                      aria-pressed={pref.visible}
                      aria-label={pref.visible ? `Hide ${meta.label}` : `Show ${meta.label}`}
                    >
                      <div className={styles.toggleTrack} data-checked={pref.visible}>
                        <div className={styles.toggleKnob} />
                      </div>
                    </button>
                  </div>

                  {/* Row 2: span selector (only when visible) */}
                  {pref.visible && (
                    <div className="flex items-center gap-1 mt-1.5 ml-7">
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Width:</span>
                      {([1, 2, 3] as ChartSpan[]).map(s => (
                        <button key={s} type="button"
                          onClick={() => apply(chartSetSpan(prefs, pref.id, s))}
                          aria-pressed={pref.span === s}
                          className={styles.spanBtn}
                          data-active={pref.span === s}
                        >
                          {s === 1 ? '1/3' : s === 2 ? '2/3' : 'Full'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center">Order and size changes apply immediately</p>
          </div>
        </div>
      )}
    </div>
  );
}
