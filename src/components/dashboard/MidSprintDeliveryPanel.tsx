// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import type { MidSprintInsight, SprintDeliveryPattern } from '@/types/throughput';

function patternStyle(pattern: SprintDeliveryPattern): {
  border: string; bg: string; badge: string; icon: string;
} {
  switch (pattern) {
    case 'Healthy Early Progress':
      return { border: 'border-green-200', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800 border-green-200', icon: '✅' };
    case 'End-Loaded Sprint':
      return { border: 'border-amber-200', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800 border-amber-200', icon: '⏱' };
    case 'Late Delivery Risk':
      return { border: 'border-orange-200', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800 border-orange-200', icon: '⚠️' };
    case 'Scope Instability':
      return { border: 'border-purple-200', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🔀' };
    case 'Blocked Sprint':
      return { border: 'border-red-200', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800 border-red-200', icon: '🚫' };
    default:
      return { border: 'border-slate-200', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: '❓' };
  }
}

function MidSprintCard({ insight }: { insight: MidSprintInsight }) {
  const style = patternStyle(insight.pattern);
  const hasDates = insight.sprintMidpoint !== null;

  return (
    <div className={`border rounded-xl p-4 ${style.border} ${style.bg} flex flex-col gap-2`}>
      {/* Sprint name + pattern badge */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-xs font-black text-slate-800 leading-snug flex-1 min-w-0">
          <span className="truncate block" title={insight.sprintName}>{insight.sprintName}</span>
          {insight.team && insight.team !== 'Unknown' && (
            <span className="text-[10px] font-normal text-slate-500">{insight.team}</span>
          )}
        </p>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge} shrink-0`}>
          <span>{style.icon}</span>
          {insight.pattern}
        </span>
      </div>

      {/* Mid-sprint gauge */}
      {hasDates ? (
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>By midpoint</span>
            <span className="font-bold">{insight.midSprintPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/60 border border-white overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${insight.midSprintPct}%`,
                background: insight.midSprintPct >= 50 ? '#16a34a' : insight.midSprintPct >= 30 ? '#d97706' : '#dc2626',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>{insight.midDoneCount} done by mid</span>
            <span>Final: {insight.finalCompletionPct}%</span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 italic">Sprint date fields missing — add Sprint Start and Sprint End to enable mid-sprint analysis.</p>
      )}

      {/* Interpretation */}
      <p className="text-[11px] text-slate-600 leading-snug">{insight.interpretation}</p>
    </div>
  );
}

interface Props { insights: MidSprintInsight[] }

export default function MidSprintDeliveryPanel({ insights }: Props) {
  if (!insights.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-400 italic shadow-sm">
        No sprint data available for mid-sprint analysis.
      </div>
    );
  }

  const endLoaded  = insights.filter(i => i.isEndLoaded).length;
  const blocked    = insights.filter(i => i.isBlocked).length;
  const healthy    = insights.filter(i => i.pattern === 'Healthy Early Progress').length;
  const withDates  = insights.filter(i => i.sprintMidpoint !== null).length;
  const avgMid     = withDates
    ? Math.round(insights.filter(i => i.sprintMidpoint !== null).reduce((s, i) => s + i.midSprintPct, 0) / withDates)
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Mid-Sprint Delivery</h3>
          <p className="text-xs text-slate-500 mt-0.5">{insights.length} sprint{insights.length !== 1 ? 's' : ''} · delivery pattern analysis</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {avgMid !== null && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${avgMid >= 50 ? 'bg-green-50 text-green-700 border-green-200' : avgMid >= 30 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              Avg midpoint: {avgMid}%
            </span>
          )}
          {healthy > 0 && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 font-semibold">✅ {healthy} healthy</span>}
          {endLoaded > 0 && <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 font-semibold">⏱ {endLoaded} end-loaded</span>}
          {blocked > 0 && <span className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 font-semibold">🚫 {blocked} blocked</span>}
        </div>
      </div>

      {/* Cards grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map(insight => (
          <MidSprintCard key={insight.sprintName} insight={insight} />
        ))}
      </div>
    </div>
  );
}
