// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Inline confidence badge — shown next to KPI values.
// Hover reveals a tooltip with the reason.
'use client';
import { useState } from 'react';
import type { MetricConfidence, ConfidenceBand } from '@/types/metricConfidence';

const BAND_STYLE: Record<ConfidenceBand, { chip: string; dot: string; label: string }> = {
  High:       { chip: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500',   label: 'High'       },
  Medium:     { chip: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400',   label: 'Medium'     },
  Low:        { chip: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400', label: 'Low'        },
  Unreliable: { chip: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-500',     label: 'Unreliable' },
  'N/A':      { chip: 'bg-slate-100 text-slate-500 border-slate-200',  dot: 'bg-slate-400',   label: 'N/A'        },
};

interface Props {
  confidence: MetricConfidence;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function MetricConfidenceBadge({ confidence, size = 'sm', showLabel = false }: Props) {
  const [open, setOpen] = useState(false);
  const style = BAND_STYLE[confidence.band];
  const isSmall = size === 'sm';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Confidence: ${confidence.band} (${confidence.confidence}%)`}
        className={`
          inline-flex items-center gap-1 border rounded-full font-bold
          transition-all cursor-help select-none
          ${isSmall ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}
          ${style.chip}
        `}
      >
        <span className={`rounded-full flex-shrink-0 ${style.dot} ${isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
        {showLabel ? style.label : `${confidence.confidence}%`}
      </button>

      {/* Tooltip */}
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-slate-900 text-white rounded-xl px-3 py-2.5 shadow-xl w-64">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                {confidence.metricLabel} — {style.label} Confidence ({confidence.confidence}%)
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-snug">{confidence.reason}</p>
            {confidence.missingFields.length > 0 && (
              <p className="text-[9px] text-slate-400 mt-1.5">
                Missing: {confidence.missingFields.join(', ')}
              </p>
            )}
          </div>
          {/* Arrow */}
          <div className="w-0 h-0 mx-auto border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
