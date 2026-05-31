// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import type { KanbanFlowSummary, KanbanPeriod, KanbanFlowHealth, KanbanBottleneckStatus } from '@/types/throughput';

// ── Helpers ───────────────────────────────────────────────────────────────────

function healthStyle(h: KanbanFlowHealth): string {
  switch (h) {
    case 'Healthy':   return 'bg-green-100 text-green-800 border-green-200';
    case 'At Risk':   return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Degraded':  return 'bg-red-100 text-red-800 border-red-200';
  }
}

function bottleneckStyle(b: KanbanBottleneckStatus): string {
  switch (b) {
    case 'None':     return 'text-green-700';
    case 'Mild':     return 'text-amber-600';
    case 'Moderate': return 'text-orange-600';
    case 'Severe':   return 'text-red-700 font-bold';
  }
}

function trendArrow(trend: number): JSX.Element {
  if (trend > 0) return <span className="text-green-600 font-bold">+{trend}↑</span>;
  if (trend < 0) return <span className="text-red-500 font-bold">{trend}↓</span>;
  return <span className="text-slate-400">→</span>;
}

function FlowBar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

function PeriodRow({ period, maxThroughput }: { period: KanbanPeriod; maxThroughput: number }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      {/* Period */}
      <td className="py-2.5 pl-4 pr-2 text-xs font-semibold text-slate-800 whitespace-nowrap">{period.periodLabel}</td>

      {/* Throughput + trend */}
      <td className="py-2.5 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 w-6 text-right">{period.completedCount}</span>
          <FlowBar value={period.completedCount} max={maxThroughput} color="#2563eb" />
          <span className="text-[11px] w-8 text-right shrink-0">{trendArrow(period.throughputTrend)}</span>
        </div>
      </td>

      {/* Cycle time */}
      <td className="py-2.5 px-2 text-center text-xs text-slate-700">
        {period.avgCycleTimeDays > 0 ? `${period.avgCycleTimeDays}d` : '—'}
      </td>

      {/* Lead time */}
      <td className="py-2.5 px-2 text-center text-xs text-slate-700">
        {period.avgLeadTimeDays > 0 ? `${period.avgLeadTimeDays}d` : '—'}
      </td>

      {/* Flow efficiency */}
      <td className="py-2.5 px-2 text-center">
        <span className={`text-xs font-bold ${period.flowEfficiencyPct >= 50 ? 'text-green-700' : period.flowEfficiencyPct >= 30 ? 'text-amber-700' : 'text-red-600'}`}>
          {period.avgLeadTimeDays > 0 ? `${period.flowEfficiencyPct}%` : '—'}
        </span>
      </td>

      {/* WIP / Aging */}
      <td className="py-2.5 px-2 text-center text-xs text-slate-700">
        {period.wipAverage}
        {period.agingWipCount > 0 && (
          <span className="ml-1 text-orange-600 font-bold">({period.agingWipCount}⏰)</span>
        )}
      </td>

      {/* Blocked / Reopened */}
      <td className="py-2.5 px-2 text-center text-xs">
        {period.blockedCount > 0 && (
          <span className="inline-block bg-red-50 text-red-700 font-bold px-1.5 rounded text-[10px] mr-1">{period.blockedCount}B</span>
        )}
        {period.reopenedCount > 0 && (
          <span className="inline-block bg-purple-50 text-purple-700 font-bold px-1.5 rounded text-[10px]">{period.reopenedCount}R</span>
        )}
        {period.blockedCount === 0 && period.reopenedCount === 0 && (
          <span className="text-slate-300">—</span>
        )}
      </td>

      {/* Bottleneck */}
      <td className="py-2.5 px-2 text-center text-xs">
        <span className={bottleneckStyle(period.bottleneckStatus)}>{period.bottleneckStatus}</span>
      </td>

      {/* Flow health */}
      <td className="py-2.5 px-2 pr-4 text-center">
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${healthStyle(period.flowHealth)}`}>
          {period.flowHealth}
        </span>
      </td>
    </tr>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props { summary: KanbanFlowSummary }

export default function KanbanThroughputPanel({ summary }: Props) {
  if (!summary.hasKanbanData || !summary.periods.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-400 italic shadow-sm">
        No Kanban flow data detected. Issues without a <strong>Sprint</strong> field and at least one completed item are analysed here.
      </div>
    );
  }

  const maxThroughput = Math.max(...summary.periods.map(p => p.completedCount), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Kanban Flow</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {summary.periods.length} reporting period{summary.periods.length !== 1 ? 's' : ''} · non-sprint issues
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${healthStyle(summary.overallFlowHealth)}`}>
          {summary.overallFlowHealth}
        </span>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-slate-100">
        {[
          { label: 'Avg Throughput / Period', value: summary.avgThroughputPerPeriod, unit: 'issues', color: '#2563eb' },
          { label: 'Avg Cycle Time',          value: summary.avgCycleTimeDays > 0 ? `${summary.avgCycleTimeDays}d` : '—', color: '#0f766e' },
          { label: 'Avg Lead Time',           value: summary.avgLeadTimeDays > 0 ? `${summary.avgLeadTimeDays}d` : '—', color: '#7c3aed' },
          { label: 'Avg Flow Efficiency',     value: summary.avgLeadTimeDays > 0 ? `${summary.avgFlowEfficiencyPct}%` : '—', color: summary.avgFlowEfficiencyPct >= 50 ? '#16a34a' : '#d97706' },
        ].map(m => (
          <div key={m.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{m.label}</p>
            <p className="text-xl font-black leading-none" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Period table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              {['Period', 'Throughput', 'Cycle', 'Lead', 'Flow Eff.', 'WIP (Aging)', 'Blocked / Reopened', 'Bottleneck', 'Health'].map(h => (
                <th key={h} className="py-2 px-2 first:pl-4 last:pr-4 text-[10px] font-800 uppercase tracking-wider text-slate-500 text-center first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.periods.map(period => (
              <PeriodRow key={period.periodLabel} period={period} maxThroughput={maxThroughput} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400">
        B = Blocked · R = Reopened · ⏰ = Aging WIP ({'>'}14 days active) · Flow Eff. = Cycle Time / Lead Time × 100
      </div>
    </div>
  );
}
