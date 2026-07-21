// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Shown immediately after upload — compact quality score + top issues.
'use client';
import type { CSSProperties } from 'react';
import type { DataQualityResult, DataQualityBand } from '@/types/dataQuality';
import styles from './DataQualitySummary.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

const BAND_STYLE: Record<DataQualityBand, { bg: string; border: string; text: string; dot: string }> = {
  Excellent: { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  dot: 'bg-green-500'  },
  Good:      { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-800',   dot: 'bg-teal-500'   },
  Fair:      { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  dot: 'bg-amber-500'  },
  Weak:      { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500' },
  Critical:  { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    dot: 'bg-red-500'    },
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-orange-600',
  medium:   'text-amber-600',
  low:      'text-slate-500',
};

interface Props {
  quality: DataQualityResult;
  compact?: boolean;
}

export default function DataQualitySummary({ quality, compact = false }: Props) {
  const style = BAND_STYLE[quality.band];
  const failing = quality.checks.filter(c => c.missing > 0);

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${style.bg} ${style.border}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${style.text} border-2 ${style.border}`}>
          {quality.score}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-black ${style.text}`}>Data Quality: {quality.band} ({quality.score}%)</p>
          <p className="text-xs text-slate-500 truncate">{quality.summary}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${style.bg} ${style.border} p-5`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-16 h-16 rounded-full border-4 ${style.border} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-xl font-black leading-none ${style.text}`}>{quality.score}</span>
          <span className="text-[9px] text-slate-400 font-bold">/ 100</span>
        </div>
        <div>
          <p className={`text-base font-black ${style.text}`}>Data Quality: {quality.band}</p>
          <p className="text-sm text-slate-600 mt-0.5 leading-snug">{quality.summary}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-white/60 mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full ${style.dot} transition-all ${styles.progressFill}`}
          style={{ '--progress-width': `${quality.score}%` } as CSSVars}
        />
      </div>

      {/* Failing checks */}
      {failing.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            Issues Found ({failing.length})
          </p>
          <ul className="space-y-1.5">
            {failing.slice(0, 6).map(check => (
              <li key={check.field} className="flex items-start gap-2 text-xs">
                <span className={`shrink-0 font-bold mt-0.5 ${SEVERITY_COLOR[check.severity]}`}>
                  {check.severity === 'critical' ? '●' : check.severity === 'high' ? '●' : '○'}
                </span>
                <span className="text-slate-700">
                  <strong>{check.missing}</strong> item{check.missing !== 1 ? 's' : ''} missing{' '}
                  <strong>{check.label}</strong>
                  {' — affects '}
                  {check.affectsMetrics.slice(0, 2).join(', ')}
                  {check.affectsMetrics.length > 2 ? ` +${check.affectsMetrics.length - 2} more` : ''}
                </span>
              </li>
            ))}
            {failing.length > 6 && (
              <li className="text-xs text-slate-400 italic pl-4">
                +{failing.length - 6} more issues — see dashboard Data Quality card
              </li>
            )}
          </ul>
        </div>
      )}

      {failing.length === 0 && (
        <p className="text-xs text-green-700 font-semibold">
          ✓ All important fields are present. Metrics are fully reliable.
        </p>
      )}
    </div>
  );
}
