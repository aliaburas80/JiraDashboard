// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import type { SprintThroughputSummary, SprintThroughput, SprintGoalOutcome, TrendDirection } from '@/types/throughput';

// ── Helpers ───────────────────────────────────────────────────────────────────

function goalChip(outcome: SprintGoalOutcome): string {
  switch (outcome) {
    case 'Met':           return 'chip c-gr';
    case 'Partially Met': return 'chip c-am';
    case 'Missed':        return 'chip c-rd';
    case 'At Risk':       return 'chip c-am';
    default:              return 'chip c-nt';
  }
}

function completionBarColor(pct: number): string {
  if (pct >= 100) return 'var(--dc-green, #22C55E)';
  if (pct >= 60)  return 'var(--dc-amber, #F59E0B)';
  if (pct > 0)    return 'var(--dc-acc, #E85D12)';
  return 'var(--dc-s4, #323232)';
}

function completionTextColor(pct: number): string {
  if (pct === 0)   return 'var(--dc-red, #F87171)';
  if (pct >= 100)  return 'var(--dc-green, #22C55E)';
  return 'var(--dc-p1, #F2F2F2)';
}

function midSprintColor(pct: number): string {
  if (pct === 0)   return 'var(--dc-red, #F87171)';
  if (pct >= 50)   return 'var(--dc-green, #22C55E)';
  return 'var(--dc-amber, #F59E0B)';
}

function trendChip(dir: TrendDirection): { label: string; cls: string } {
  switch (dir) {
    case 'Improving': return { label: '↑ Improving', cls: 'chip c-gr' };
    case 'Declining': return { label: '↓ Declining', cls: 'chip c-am' };
    default:          return { label: '→ Stable',    cls: 'chip c-nt' };
  }
}

// ── Headline metric card ──────────────────────────────────────────────────────

function HeadlineCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl px-5 py-4 shadow-sm flex-1 min-w-[140px]"
      style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--dc-p3, #505050)' }}>{label}</p>
      <p className="text-2xl font-black leading-none" style={{ color, fontFamily: 'var(--font-mono, monospace)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--dc-p2, #909090)' }}>{sub}</p>}
    </div>
  );
}

// ── Sprint row ────────────────────────────────────────────────────────────────

function SprintRow({ sprint }: { sprint: SprintThroughput }) {
  const met = sprint.completionPct >= 100 || sprint.goalOutcome === 'Met';
  const nameColor = met ? 'var(--dc-acc2, #FF8A4C)' : 'var(--dc-p2, #909090)';
  return (
    <tr style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
      className="transition-colors hover:[&>td]:bg-[rgba(255,255,255,0.025)]">
      {/* Sprint name */}
      <td className="py-2.5 pl-4 pr-2 text-xs font-semibold max-w-[180px]" style={{ color: nameColor }}>
        <span className="block truncate" title={sprint.sprintName}>{sprint.sprintName}</span>
        {sprint.team && sprint.team !== 'Unknown' && (
          <span className="text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>{sprint.team}</span>
        )}
      </td>

      {/* Committed / Done */}
      <td className="py-2.5 px-2 text-center text-xs">
        <span className="font-bold" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{sprint.completedCount}</span>
        <span style={{ color: 'var(--dc-p3, #505050)' }}> / {sprint.committedCount}</span>
      </td>

      {/* Points */}
      <td className="py-2.5 px-2 text-center text-xs">
        <span className="font-bold" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{sprint.completedPoints}</span>
        <span style={{ color: 'var(--dc-p3, #505050)' }}> / {sprint.committedPoints}</span>
      </td>

      {/* Completion bar */}
      <td className="py-2.5 px-2 min-w-[110px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--dc-s3, #282828)' }}>
            <div className="h-full rounded-full" style={{ width: `${sprint.completionPct}%`, background: completionBarColor(sprint.completionPct) }} />
          </div>
          <span className="text-[11px] font-bold w-8 text-right shrink-0" style={{ color: completionTextColor(sprint.completionPct) }}>
            {sprint.completionPct}%
          </span>
        </div>
      </td>

      {/* Mid-sprint % */}
      <td className="py-2.5 px-2 text-center">
        <span className="text-xs font-bold" style={{ color: midSprintColor(sprint.midSprintPct) }}>
          {sprint.sprintMidpoint ? `${sprint.midSprintPct}%` : '—'}
        </span>
      </td>

      {/* Goal outcome */}
      <td className="py-2.5 px-2">
        <span className={goalChip(sprint.goalOutcome)} style={{ fontSize: 10 }}>
          {sprint.goalOutcome}
        </span>
      </td>

      {/* Blocked / Carryover */}
      <td className="py-2.5 px-2 text-center text-xs">
        {sprint.blockedCount > 0 && (
          <span className="chip c-rd font-bold mr-1" style={{ fontSize: 10 }}>
            {sprint.blockedCount}B
          </span>
        )}
        {sprint.carryoverCount > 0 && (
          <span className="chip c-am font-bold" style={{ fontSize: 10 }}>
            {sprint.carryoverCount}C
          </span>
        )}
        {sprint.blockedCount === 0 && sprint.carryoverCount === 0 && (
          <span style={{ color: 'var(--dc-p3, #505050)' }}>—</span>
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
      <div className="rounded-2xl p-6 text-sm italic shadow-sm"
        style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p3, #505050)' }}>
        No sprint data detected. Add a <strong>Sprint</strong>, <strong>Sprint Start</strong>, and <strong>Sprint End</strong> column to your Jira export to enable sprint throughput analytics.
      </div>
    );
  }

  const trend = trendChip(summary.trendDirection);

  const completionColor = summary.averageCompletionPct === 0 ? 'var(--dc-red, #F87171)'
    : summary.averageCompletionPct >= 75 ? 'var(--dc-amber, #F59E0B)'
    : 'var(--dc-acc2, #FF8A4C)';

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', background: 'var(--dc-s1, #141414)' }}>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Sprint Throughput</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--dc-p3, #505050)' }}>{summary.totalSprints} sprint{summary.totalSprints !== 1 ? 's' : ''} analysed</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={trend.cls} style={{ borderRadius: 100, fontSize: 10 }}>{trend.label}</span>
          {summary.deliveryTrendValue !== 0 && (
            <span className="text-xs" style={{ color: 'var(--dc-p3, #505050)' }}>
              ({summary.deliveryTrendValue > 0 ? '+' : ''}{summary.deliveryTrendValue} issues vs prev 3 sprints)
            </span>
          )}
        </div>
      </div>

      {/* Headline metrics */}
      <div className="flex flex-wrap gap-3 p-4" style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
        <HeadlineCard label="Avg Throughput"      value={summary.averageThroughputCount}         sub="issues / sprint"    color="var(--dc-acc2, #FF8A4C)" />
        <HeadlineCard label="Avg Story Points"     value={summary.averageThroughputPoints}        sub="points / sprint"    color="var(--dc-acc2, #FF8A4C)" />
        <HeadlineCard label="Avg Completion"       value={`${summary.averageCompletionPct}%`}     sub="committed → done"   color={completionColor} />
        <HeadlineCard label="Avg Mid-Sprint"       value={`${summary.averageMidSprintPct}%`}      sub="done by midpoint"   color={midSprintColor(summary.averageMidSprintPct)} />
        <HeadlineCard label="Delivery Confidence"  value={`${summary.overallDeliveryConfidence}%`} sub="overall"           color="var(--dc-acc2, #FF8A4C)" />
      </div>

      {/* Sprint table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', background: 'var(--dc-s1, #141414)' }}>
              {['Sprint', 'Done / Committed', 'Points', 'Completion', 'Mid-Sprint', 'Goal', 'Risk'].map(h => (
                <th key={h} className="py-2 px-2 text-left text-[10px] font-bold uppercase tracking-wider first:pl-4"
                  style={{ color: 'var(--dc-p3, #505050)' }}>{h}</th>
              ))}
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
        <div className="flex flex-wrap gap-3 px-4 py-3"
          style={{ borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', background: 'var(--dc-s1, #141414)' }}>
          {summary.endLoadedSprintCount > 0 && (
            <span className="chip c-am" style={{ borderRadius: 100, fontSize: 10 }}>
              ⚠ {summary.endLoadedSprintCount} end-loaded sprint{summary.endLoadedSprintCount !== 1 ? 's' : ''}
            </span>
          )}
          {summary.blockedSprintCount > 0 && (
            <span className="chip c-rd" style={{ borderRadius: 100, fontSize: 10 }}>
              🚫 {summary.blockedSprintCount} blocked sprint{summary.blockedSprintCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs ml-auto" style={{ color: 'var(--dc-p3, #505050)' }}>B = Blocked items · C = Carryover items</span>
        </div>
      )}
    </div>
  );
}
