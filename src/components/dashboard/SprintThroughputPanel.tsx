// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import type { SprintThroughputSummary, SprintThroughput, SprintGoalOutcome, TrendDirection } from '@/types/throughput';

// ── Helpers ───────────────────────────────────────────────────────────────────

function goalColor(outcome: SprintGoalOutcome): string {
  switch (outcome) {
    case 'Met':           return 'bg-green-100 text-green-800 border-green-200';
    case 'Partially Met': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Missed':        return 'bg-red-100 text-red-800 border-red-200';
    case 'At Risk':       return 'bg-orange-100 text-orange-800 border-orange-200';
    default:              return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function completionColor(pct: number): string {
  if (pct >= 90) return 'bg-green-500';
  if (pct >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function trendIcon(dir: TrendDirection): { icon: string; color: string } {
  switch (dir) {
    case 'Improving': return { icon: '↑', color: 'text-green-600' };
    case 'Declining': return { icon: '↓', color: 'text-red-600' };
    default:          return { icon: '→', color: 'text-slate-500' };
  }
}

// ── Headline metric card ──────────────────────────────────────────────────────

function HeadlineCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm flex-1 min-w-[140px]">
      <p className="text-[10px] font-700 uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Sprint row ────────────────────────────────────────────────────────────────

function SprintRow({ sprint }: { sprint: SprintThroughput }) {
  const barColor = completionColor(sprint.completionPct);
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      {/* Sprint name */}
      <td className="py-2.5 pl-4 pr-2 text-xs font-semibold text-slate-800 max-w-[180px]">
        <span className="block truncate" title={sprint.sprintName}>{sprint.sprintName}</span>
        {sprint.team && sprint.team !== 'Unknown' && (
          <span className="text-[10px] text-slate-400">{sprint.team}</span>
        )}
      </td>

      {/* Committed / Done */}
      <td className="py-2.5 px-2 text-center text-xs text-slate-700">
        <span className="font-bold text-slate-900">{sprint.completedCount}</span>
        <span className="text-slate-400"> / {sprint.committedCount}</span>
      </td>

      {/* Points */}
      <td className="py-2.5 px-2 text-center text-xs text-slate-700">
        <span className="font-bold text-slate-900">{sprint.completedPoints}</span>
        <span className="text-slate-400"> / {sprint.committedPoints}</span>
      </td>

      {/* Completion bar */}
      <td className="py-2.5 px-2 min-w-[110px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${sprint.completionPct}%` }} />
          </div>
          <span className="text-[11px] font-bold text-slate-700 w-8 text-right shrink-0">
            {sprint.completionPct}%
          </span>
        </div>
      </td>

      {/* Mid-sprint % */}
      <td className="py-2.5 px-2 text-center">
        <span className={`text-xs font-bold ${sprint.midSprintPct >= 50 ? 'text-green-700' : sprint.midSprintPct >= 30 ? 'text-amber-700' : 'text-red-600'}`}>
          {sprint.sprintMidpoint ? `${sprint.midSprintPct}%` : '—'}
        </span>
      </td>

      {/* Goal outcome */}
      <td className="py-2.5 px-2">
        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${goalColor(sprint.goalOutcome)}`}>
          {sprint.goalOutcome}
        </span>
      </td>

      {/* Blocked / Carryover */}
      <td className="py-2.5 px-2 text-center text-xs">
        {sprint.blockedCount > 0 && (
          <span className="inline-block bg-red-50 text-red-700 font-bold px-1.5 rounded text-[10px] mr-1">
            {sprint.blockedCount}B
          </span>
        )}
        {sprint.carryoverCount > 0 && (
          <span className="inline-block bg-amber-50 text-amber-700 font-bold px-1.5 rounded text-[10px]">
            {sprint.carryoverCount}C
          </span>
        )}
        {sprint.blockedCount === 0 && sprint.carryoverCount === 0 && (
          <span className="text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props { summary: SprintThroughputSummary }

export default function SprintThroughputPanel({ summary }: Props) {
  if (!summary.totalSprints) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-400 italic shadow-sm">
        No sprint data detected. Add a <strong>Sprint</strong>, <strong>Sprint Start</strong>, and <strong>Sprint End</strong> column to your Jira export to enable sprint throughput analytics.
      </div>
    );
  }

  const trend = trendIcon(summary.trendDirection);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Sprint Throughput</h3>
          <p className="text-xs text-slate-500 mt-0.5">{summary.totalSprints} sprint{summary.totalSprints !== 1 ? 's' : ''} analysed</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className={trend.color}>{trend.icon}</span>
          <span className={trend.color}>{summary.trendDirection}</span>
          {summary.deliveryTrendValue !== 0 && (
            <span className="text-slate-400 font-normal">
              ({summary.deliveryTrendValue > 0 ? '+' : ''}{summary.deliveryTrendValue} issues vs prev 3 sprints)
            </span>
          )}
        </div>
      </div>

      {/* Headline metrics */}
      <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
        <HeadlineCard label="Avg Throughput" value={summary.averageThroughputCount} sub="issues / sprint" color="#2563eb" />
        <HeadlineCard label="Avg Story Points" value={summary.averageThroughputPoints} sub="points / sprint" color="#7c3aed" />
        <HeadlineCard label="Avg Completion" value={`${summary.averageCompletionPct}%`} sub="committed → done" color={summary.averageCompletionPct >= 80 ? '#16a34a' : summary.averageCompletionPct >= 60 ? '#d97706' : '#dc2626'} />
        <HeadlineCard label="Avg Mid-Sprint" value={`${summary.averageMidSprintPct}%`} sub="done by midpoint" color={summary.averageMidSprintPct >= 50 ? '#16a34a' : '#d97706'} />
        <HeadlineCard label="Delivery Confidence" value={`${summary.overallDeliveryConfidence}%`} sub="overall" color={summary.overallDeliveryConfidence >= 70 ? '#16a34a' : '#d97706'} />
      </div>

      {/* Sprint table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left">
              <th className="py-2 pl-4 pr-2 text-[10px] font-800 uppercase tracking-wider text-slate-500">Sprint</th>
              <th className="py-2 px-2 text-[10px] font-800 uppercase tracking-wider text-slate-500 text-center">Done / Committed</th>
              <th className="py-2 px-2 text-[10px] font-800 uppercase tracking-wider text-slate-500 text-center">Points</th>
              <th className="py-2 px-2 text-[10px] font-800 uppercase tracking-wider text-slate-500">Completion</th>
              <th className="py-2 px-2 text-[10px] font-800 uppercase tracking-wider text-slate-500 text-center">Mid-Sprint</th>
              <th className="py-2 px-2 text-[10px] font-800 uppercase tracking-wider text-slate-500">Goal</th>
              <th className="py-2 px-2 text-[10px] font-800 uppercase tracking-wider text-slate-500 text-center">Risk</th>
            </tr>
          </thead>
          <tbody>
            {summary.sprints.map(sprint => (
              <SprintRow key={sprint.sprintName} sprint={sprint} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer notes */}
      {(summary.endLoadedSprintCount > 0 || summary.blockedSprintCount > 0) && (
        <div className="flex flex-wrap gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50">
          {summary.endLoadedSprintCount > 0 && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 font-semibold">
              ⚠ {summary.endLoadedSprintCount} end-loaded sprint{summary.endLoadedSprintCount !== 1 ? 's' : ''}
            </span>
          )}
          {summary.blockedSprintCount > 0 && (
            <span className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1 font-semibold">
              🚫 {summary.blockedSprintCount} blocked sprint{summary.blockedSprintCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs text-slate-400 ml-auto">B = Blocked items · C = Carryover items</span>
        </div>
      )}
    </div>
  );
}
