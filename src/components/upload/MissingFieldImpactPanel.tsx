// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Shows what specific data each missing/incomplete column is causing in the dashboard.
'use client';
import { useState } from 'react';
import type { FieldImpact, FieldImpactReport, CheckSeverity } from '@/types/dataQuality';

const SEV_CONFIG: Record<CheckSeverity, { badge: string; dot: string; icon: string }> = {
  critical: { badge: 'bg-red-100 text-red-800 border-red-200',    dot: 'bg-red-500',    icon: '🔴' },
  high:     { badge: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', icon: '🟠' },
  medium:   { badge: 'bg-amber-100 text-amber-700 border-amber-200',  dot: 'bg-amber-400',  icon: '🟡' },
  low:      { badge: 'bg-slate-100 text-slate-600 border-slate-200',  dot: 'bg-slate-400',  icon: '⚪' },
};

function ImpactRow({ impact }: { impact: FieldImpact }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV_CONFIG[impact.severity];

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-base shrink-0 mt-0.5">{sev.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-800">{impact.label}</span>
            {impact.isColumnAbsent && (
              <span className="text-[9px] font-bold bg-slate-200 text-slate-600 rounded px-1.5 py-0.5">COLUMN ABSENT</span>
            )}
            <span className={`text-[9px] font-bold border rounded px-1.5 py-0.5 ${sev.badge}`}>
              {impact.severity}
            </span>
            <span className="text-[10px] text-slate-400">
              {impact.missingCount} of {impact.totalApplicable} items ({impact.missingPct}%)
            </span>
          </div>
          <p className="text-xs text-red-700 mt-1 leading-snug">{impact.whatYouSeeNow}</p>
        </div>
        <span className={`text-slate-400 shrink-0 transition-transform mt-0.5 ${expanded ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Detail — expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 space-y-3 pt-3">
          {/* Missing bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Missing</span>
              <span>{impact.missingPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-red-400" style={{ width: `${impact.missingPct}%` }} />
            </div>
          </div>

          {/* What you'll gain */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-green-700 mb-1">What you&apos;ll gain</p>
            <p className="text-xs text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 leading-snug">
              ✓ {impact.whatYoullGain}
            </p>
          </div>

          {/* Fallback used */}
          {impact.fallbackUsed && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠ Fallback: {impact.fallbackUsed}
            </div>
          )}

          {/* Affected locations */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Affected in dashboard</p>
            <ul className="space-y-1">
              {impact.dashboardLocations.map((loc, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <span className="text-slate-300 shrink-0 mt-0.5">→</span>
                  {loc}
                </li>
              ))}
            </ul>
          </div>

          {/* Fix */}
          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="font-bold">Fix: </span>{impact.suggestedFix}
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  report: FieldImpactReport;
  compact?: boolean;
}

export default function MissingFieldImpactPanel({ report, compact = false }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (!report.hasIssues) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-sm font-black text-green-800">All important columns are present</p>
          <p className="text-xs text-green-600 mt-0.5">No missing-column impacts detected. Metrics are fully reliable.</p>
        </div>
      </div>
    );
  }

  const displayImpacts = compact
    ? report.all.slice(0, 3)
    : (showAll ? report.all : report.all.slice(0, 5));

  const remaining = report.all.length - displayImpacts.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-800">Missing Column Impact</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug max-w-xl">{report.topSummary}</p>
          </div>
          <div className="flex gap-1.5">
            {report.critical.length > 0 && (
              <span className="text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 rounded-full px-2 py-0.5">
                {report.critical.length} Critical
              </span>
            )}
            {report.high.length > 0 && (
              <span className="text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 rounded-full px-2 py-0.5">
                {report.high.length} High
              </span>
            )}
            {report.medium.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                {report.medium.length} Medium
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Impact list */}
      <div className="p-4 space-y-2">
        {displayImpacts.map(impact => (
          <ImpactRow key={impact.field} impact={impact} />
        ))}

        {remaining > 0 && !compact && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700 py-2 border border-dashed border-slate-200 rounded-xl transition-colors"
          >
            Show {remaining} more impact{remaining !== 1 ? 's' : ''} ↓
          </button>
        )}

        {compact && report.all.length > 3 && (
          <p className="text-xs text-slate-400 text-center pt-1">
            +{report.all.length - 3} more — see Full Report → Data Quality section
          </p>
        )}
      </div>
    </div>
  );
}
