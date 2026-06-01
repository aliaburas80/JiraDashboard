// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Sprint Velocity Chart — committed vs completed story points per sprint.
// Shows trend direction and average velocity line.
'use client';

import type { SprintThroughputSummary } from '@/types/throughput';

interface Props {
  summary: SprintThroughputSummary;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function completionColor(pct: number): string {
  if (pct >= 90) return '#16a34a';
  if (pct >= 60) return '#f59e0b';
  return '#dc2626';
}

function shortName(name: string): string {
  // "Sprint 14" → "S14", "2025-Q1-Sprint-3" → first 9 chars
  const match = name.match(/(\d+)$/);
  if (match) return `S${match[1]}`;
  return name.length > 8 ? name.slice(0, 8) + '…' : name;
}

// ── Grouped bar pair per sprint ───────────────────────────────────────────────

function SprintBar({
  label, committed, completed, maxValue, completionPct,
}: {
  label: string; committed: number; completed: number; maxValue: number; completionPct: number;
}) {
  const committedH = maxValue > 0 ? Math.max(4, Math.round((committed / maxValue) * 100)) : 4;
  const completedH = maxValue > 0 ? Math.max(4, Math.round((completed / maxValue) * 100)) : 4;
  const color = completionColor(completionPct);

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* Values on top */}
      <div className="flex items-end gap-0.5 text-[9px] font-bold w-full justify-center">
        <span className="text-slate-400">{committed}</span>
        <span className="text-slate-300">/</span>
        <span style={{ color }}>{completed}</span>
      </div>

      {/* Bars */}
      <div className="relative w-full h-28 flex items-end justify-center gap-0.5">
        {/* Committed (gray background bar) */}
        <div
          className="w-3 rounded-t transition-all"
          style={{ height: `${committedH}%`, background: '#e2e8f0' }}
          title={`Committed: ${committed} SP`}
        />
        {/* Completed (colored foreground bar) */}
        <div
          className="w-3 rounded-t transition-all"
          style={{ height: `${completedH}%`, background: color }}
          title={`Completed: ${completed} SP`}
        />
      </div>

      {/* Sprint label */}
      <span className="text-[9px] text-slate-500 text-center leading-none max-w-full truncate w-full text-center"
        title={label}>
        {label}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SprintVelocityChart({ summary }: Props) {
  const sprints = summary.sprints.filter(s => s.committedPoints > 0 || s.completedPoints > 0);
  const displayed = [...sprints].reverse().slice(0, 10); // oldest first, max 10

  if (!sprints.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📈</span>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Sprint Velocity — Story Points</h3>
        </div>
        <p className="text-sm text-slate-400 italic">
          No story points data found. Add a <strong>Story Points</strong> column to your Jira export and estimate backlog items to enable velocity tracking.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...displayed.map(s => Math.max(s.committedPoints, s.completedPoints)), 1);
  const avgCompleted = Math.round(summary.averageThroughputPoints);

  // Trend arrow
  const trendColor = summary.trendDirection === 'Improving' ? '#16a34a'
    : summary.trendDirection === 'Declining' ? '#dc2626' : '#94a3b8';
  const trendIcon  = summary.trendDirection === 'Improving' ? '↑'
    : summary.trendDirection === 'Declining' ? '↓' : '→';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
              Sprint Velocity — Story Points
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {displayed.length} sprint{displayed.length !== 1 ? 's' : ''} · committed vs completed
            </p>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Velocity</p>
            <p className="text-lg font-black text-purple-700 leading-none">{avgCompleted}<span className="text-xs font-bold text-slate-400 ml-0.5">SP</span></p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend</p>
            <p className="text-lg font-black leading-none" style={{ color: trendColor }}>
              {trendIcon} <span className="text-xs">{summary.trendDirection}</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-center min-w-[90px] max-w-[140px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Sprint</p>
            <p className="text-xs font-black text-slate-700 leading-none truncate" title={summary.bestSprintName}>
              {summary.bestSprintName || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="p-5">
        {/* Average velocity reference line label */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 border-t-2 border-dashed border-purple-300" />
          <span className="text-xs text-purple-500 font-semibold">avg {avgCompleted} SP completed</span>
        </div>

        {/* Bars */}
        <div className="flex items-end gap-1 w-full">
          {displayed.map(sprint => (
            <SprintBar
              key={sprint.sprintName}
              label={shortName(sprint.sprintName)}
              committed={sprint.committedPoints}
              completed={sprint.completedPoints}
              maxValue={maxValue}
              completionPct={sprint.pointCompletionPct}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />
            <span className="text-xs text-slate-500">Committed SP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />
            <span className="text-xs text-slate-500">Completed ≥ 90%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
            <span className="text-xs text-slate-500">Completed ≥ 60%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
            <span className="text-xs text-slate-500">Completed &lt; 60%</span>
          </div>
          <span className="text-xs text-slate-400 ml-auto">Top numbers: committed / completed</span>
        </div>
      </div>
    </div>
  );
}
