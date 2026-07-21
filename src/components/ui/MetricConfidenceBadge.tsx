// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Inline confidence badge — shown next to KPI values.
// Uses a React portal so the tooltip escapes any overflow:hidden parent.
'use client';
import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { MetricConfidence, ConfidenceBand } from '@/types/metricConfidence';
import styles from './MetricConfidenceBadge.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

const BAND_STYLE: Record<ConfidenceBand, { chip: string; dot: string; label: string }> = {
  High:       { chip: 'bg-green-50 text-green-700 border-green-200',    dot: 'bg-green-500',  label: 'High'       },
  Medium:     { chip: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-400',  label: 'Medium'     },
  Low:        { chip: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400', label: 'Low'        },
  Unreliable: { chip: 'bg-red-50 text-red-700 border-red-200',          dot: 'bg-red-500',    label: 'Unreliable' },
  'N/A':      { chip: 'bg-slate-100 text-slate-500 border-slate-200',   dot: 'bg-slate-400',  label: 'N/A'        },
};

interface Props {
  confidence: MetricConfidence;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function MetricConfidenceBadge({ confidence, size = 'sm', showLabel = false }: Props) {
  const [open, setOpen]   = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const style   = BAND_STYLE[confidence.band];
  const isSmall = size === 'sm';

  function handleMouseEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top:  rect.top + window.scrollY,   // absolute page position
        left: rect.left + rect.width / 2,
      });
    }
    setOpen(true);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        onFocus={handleMouseEnter}
        onBlur={() => setOpen(false)}
        aria-label={`KPI Reliability: ${confidence.band} (${confidence.confidence}%)`}
        className={[
          'inline-flex items-center gap-1 border rounded-full font-bold transition-colors cursor-help select-none',
          isSmall ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5',
          style.chip,
        ].join(' ')}
      >
        <span className={`rounded-full flex-shrink-0 ${style.dot} ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
        {showLabel ? style.label : `${confidence.confidence}%`}
      </button>

      {/* Portal tooltip — renders at document.body, escapes all overflow:hidden */}
      {open && mounted && createPortal(
        <div
          className={styles.tooltipWrap}
          // DYNAMIC CSS VARIABLE: position tracks the trigger button's live
          // bounding rect, measured on hover/focus.
          style={{ '--tooltip-top': `${coords.top - 8}px`, '--tooltip-left': `${coords.left}px` } as CSSVars}
        >
          <div className="bg-slate-900 text-white rounded-xl px-3 py-2.5 shadow-2xl w-64">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 leading-snug">
                {confidence.metricLabel} — {style.label} ({confidence.confidence}%)
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-snug">{confidence.reason}</p>
            {confidence.missingFields.length > 0 && (
              <p className="text-[9px] text-slate-400 mt-1.5">
                Missing: {confidence.missingFields.join(', ')}
              </p>
            )}
          </div>
          {/* Arrow pointing down */}
          <div className={styles.tooltipArrow} />
        </div>,
        document.body,
      )}
    </>
  );
}
