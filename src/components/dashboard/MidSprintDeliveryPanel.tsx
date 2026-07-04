// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import type { MidSprintInsight, SprintDeliveryPattern } from '@/types/throughput';
import { SvgIcon } from '@/components/ui/SvgIcon';

function patternChip(pattern: SprintDeliveryPattern): { cls: string; icon: string; borderLeft?: string } {
  switch (pattern) {
    case 'Healthy Early Progress': return { cls: 'chip c-gr',  icon: 'checkCircle' };
    case 'End-Loaded Sprint':      return { cls: 'chip c-am',  icon: 'clock', borderLeft: '3px solid var(--dc-amber, #F59E0B)' };
    case 'Late Delivery Risk':     return { cls: 'chip c-am',  icon: 'warning', borderLeft: '3px solid var(--dc-amber, #F59E0B)' };
    case 'Scope Instability':      return { cls: 'chip c-or',  icon: 'workflow' };
    case 'Blocked Sprint':         return { cls: 'chip c-rd',  icon: 'priorityBlocker', borderLeft: '3px solid var(--dc-red, #F87171)' };
    default:                       return { cls: 'chip c-nt',  icon: 'question' };
  }
}

function midBarColor(pct: number): string {
  if (pct >= 50) return 'var(--dc-green, #22C55E)';
  if (pct >= 30) return 'var(--dc-amber, #F59E0B)';
  return 'var(--dc-acc, #E85D12)';
}

function MidSprintCard({ insight }: { insight: MidSprintInsight }) {
  const { cls, icon, borderLeft } = patternChip(insight.pattern);
  const hasDates = insight.sprintMidpoint !== null;

  return (
    <div className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: 'var(--dc-s2, #1E1E1E)',
        border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
        borderLeft: borderLeft ?? '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
        borderRadius: 9,
      }}>
      {/* Sprint name + pattern badge */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="text-xs font-black leading-snug flex-1 min-w-0" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>
          <span className="truncate block" title={insight.sprintName}>{insight.sprintName}</span>
          {insight.team && insight.team !== 'Unknown' && (
            <span className="text-[10px] font-normal" style={{ color: 'var(--dc-p3, #505050)' }}>{insight.team}</span>
          )}
        </p>
        <span className={`${cls} shrink-0`} style={{ fontSize: 10 }}>
          <SvgIcon name={icon} size={10} /> {insight.pattern}
        </span>
      </div>

      {/* Mid-sprint gauge */}
      {hasDates ? (
        <div>
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--dc-p3, #505050)' }}>
            <span>By midpoint</span>
            <span className="font-bold" style={{ color: 'var(--dc-p2, #909090)' }}>{insight.midSprintPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--dc-s3, #282828)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${insight.midSprintPct}%`, background: midBarColor(insight.midSprintPct) }} />
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--dc-p3, #505050)' }}>
            <span>{insight.midDoneCount} done by mid</span>
            <span className="font-bold" style={{ color: 'var(--dc-acc2, #FF8A4C)', fontFamily: 'var(--font-mono, monospace)' }}>
              Final: {insight.finalCompletionPct}%
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] italic" style={{ color: 'var(--dc-p3, #505050)' }}>Sprint date fields missing — add Sprint Start and Sprint End to enable mid-sprint analysis.</p>
      )}

      {/* Interpretation */}
      <p className="text-[11px] leading-snug" style={{ color: 'var(--dc-p2, #909090)' }}>{insight.interpretation}</p>
    </div>
  );
}

interface Props { insights: MidSprintInsight[] }

export default function MidSprintDeliveryPanel({ insights }: Props) {
  if (!insights.length) {
    return (
      <div className="rounded-2xl p-6 text-sm italic shadow-sm"
        style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr)', color: 'var(--dc-p3, #505050)' }}>
        No sprint data available for mid-sprint analysis.
      </div>
    );
  }

  const endLoaded = insights.filter(i => i.isEndLoaded).length;
  const blocked   = insights.filter(i => i.isBlocked).length;
  const healthy   = insights.filter(i => i.pattern === 'Healthy Early Progress').length;
  const withDates = insights.filter(i => i.sprintMidpoint !== null).length;
  const avgMid    = withDates
    ? Math.round(insights.filter(i => i.sprintMidpoint !== null).reduce((s, i) => s + i.midSprintPct, 0) / withDates)
    : null;

  const avgMidCls = avgMid === null ? '' : avgMid >= 50 ? 'chip c-gr' : avgMid >= 30 ? 'chip c-am' : 'chip c-rd';

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--dc-bdr)', background: 'var(--dc-s1, #141414)' }}>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Mid-Sprint Delivery</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--dc-p3, #505050)' }}>{insights.length} sprint{insights.length !== 1 ? 's' : ''} · delivery pattern analysis</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {avgMid !== null && (
            <span className={avgMidCls} style={{ fontSize: 10, borderRadius: 100 }}>Avg midpoint: {avgMid}%</span>
          )}
          {healthy   > 0 && <span className="chip c-gr"  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, borderRadius: 100 }}><SvgIcon name="checkCircle" size={11} /> {healthy} healthy</span>}
          {endLoaded > 0 && <span className="chip c-am"  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, borderRadius: 100 }}><SvgIcon name="stopwatch" size={11} /> {endLoaded} end-loaded</span>}
          {blocked   > 0 && <span className="chip c-rd"  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, borderRadius: 100 }}><SvgIcon name="priorityBlocker" size={11} /> {blocked} blocked</span>}
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
