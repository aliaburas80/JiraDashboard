// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Full Data Quality card for the dashboard — collapsible, all checks shown.
'use client';
import { useState } from 'react';
import type { DataQualityResult, DataQualityBand, CheckSeverity } from '@/types/dataQuality';

const BAND_COLOR: Record<DataQualityBand, string> = {
  Excellent: '#16a34a', Good: '#0f766e', Fair: '#d97706', Weak: '#ea580c', Critical: '#dc2626',
};

const SEV_BADGE: Record<CheckSeverity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high:     'bg-orange-100 text-orange-800 border-orange-200',
  medium:   'bg-amber-100 text-amber-800 border-amber-200',
  low:      'bg-slate-100 text-slate-600 border-slate-200',
};

interface Props { quality: DataQualityResult }

export default function DataQualityCard({ quality }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color   = BAND_COLOR[quality.band];
  const failing = quality.checks.filter(c => c.missing > 0);
  const passing = quality.checks.filter(c => c.missing === 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        {/* Score ring */}
        <div
          className="w-12 h-12 rounded-full border-4 flex flex-col items-center justify-center shrink-0"
          style={{ borderColor: color }}
        >
          <span className="text-sm font-black leading-none" style={{ color }}>{quality.score}</span>
          <span className="text-[8px] text-slate-400 font-bold">/ 100</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-slate-800">Data Quality</span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: color + '20', color }}
            >
              {quality.band}
            </span>
            {failing.length > 0 && (
              <span className="text-xs text-slate-400">
                {failing.length} issue{failing.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{quality.summary}</p>
        </div>

        {/* Progress bar + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
            <div className="h-full rounded-full transition-all" style={{ width: `${quality.score}%`, background: color }} />
          </div>
          <span className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-100">

          {/* Affected metrics */}
          {quality.affectedMetrics.length > 0 && (
            <div className="mt-4 mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Affected Metrics</p>
              <div className="flex flex-wrap gap-1.5">
                {quality.affectedMetrics.map(m => (
                  <span key={m} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 font-semibold">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Failing checks */}
          {failing.length > 0 && (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Issues to Fix</p>
              <div className="space-y-2 mb-5">
                {failing.map(check => (
                  <div key={check.field} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${SEV_BADGE[check.severity]} shrink-0 mt-0.5`}>
                      {check.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">{check.label}</span>
                        <span className="text-xs text-slate-400">
                          {check.missing} of {check.total} missing ({check.missingPct}%)
                        </span>
                      </div>
                      {/* Mini bar */}
                      <div className="h-1 rounded-full bg-slate-200 overflow-hidden mt-1 mb-1.5">
                        <div
                          className="h-full rounded-full bg-red-400"
                          style={{ width: `${check.missingPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mb-1">
                        Affects: {check.affectsMetrics.join(', ')}
                      </p>
                      <p className="text-[10px] text-blue-600 font-semibold">
                        Fix: {check.suggestedFix}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Passing checks */}
          {passing.length > 0 && (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Passing ({passing.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {passing.map(check => (
                  <span key={check.field} className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">
                    ✓ {check.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
