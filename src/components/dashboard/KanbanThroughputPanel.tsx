// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import type { KanbanFlowSummary, KanbanPeriod, KanbanFlowHealth, KanbanBottleneckStatus } from '@/types/throughput';

function healthChip(h: KanbanFlowHealth): string {
  switch (h) {
    case 'Healthy':  return 'chip c-gr';
    case 'At Risk':  return 'chip c-am';
    case 'Degraded': return 'chip c-rd';
  }
}

function bottleneckColor(b: KanbanBottleneckStatus): string {
  switch (b) {
    case 'None':     return 'var(--dc-green, #22C55E)';
    case 'Mild':     return 'var(--dc-acc2, #FF8A4C)';
    case 'Moderate': return 'var(--dc-amber, #F59E0B)';
    case 'Severe':   return 'var(--dc-acc, #E85D12)';
  }
}

function trendArrow(trend: number): JSX.Element {
  if (trend > 0) return <span className="font-bold" style={{ color: 'var(--dc-green, #22C55E)' }}>+{trend}↑</span>;
  if (trend < 0) return <span className="font-bold" style={{ color: 'var(--dc-red, #F87171)' }}>{trend}↓</span>;
  return <span style={{ color: 'var(--dc-p3, #505050)' }}>→</span>;
}

function FlowBar({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--dc-s3, #282828)' }}>
      <div className="h-full rounded-full" style={{ width: `${w}%`, background: 'var(--dc-acc2, #FF8A4C)' }} />
    </div>
  );
}

function PeriodRow({ period, maxThroughput }: { period: KanbanPeriod; maxThroughput: number }) {
  const flowEffColor = period.flowEfficiencyPct > 80
    ? 'var(--dc-acc2, #FF8A4C)'
    : period.flowEfficiencyPct >= 50
    ? 'var(--dc-amber, #F59E0B)'
    : 'var(--dc-red, #F87171)';

  return (
    <tr style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
      className="transition-colors hover:[&>td]:bg-[rgba(255,255,255,0.025)]">
      <td className="py-2.5 pl-4 pr-2 text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--dc-p2, #909090)' }}>
        {period.periodLabel}
      </td>
      <td className="py-2.5 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold w-6 text-right" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{period.completedCount}</span>
          <FlowBar value={period.completedCount} max={maxThroughput} />
          <span className="text-[11px] w-8 text-right shrink-0">{trendArrow(period.throughputTrend)}</span>
        </div>
      </td>
      <td className="py-2.5 px-2 text-center text-xs" style={{ color: 'var(--dc-p1, #F2F2F2)', fontFamily: 'var(--font-mono, monospace)' }}>
        {period.avgCycleTimeDays > 0 ? `${period.avgCycleTimeDays}d` : '—'}
      </td>
      <td className="py-2.5 px-2 text-center text-xs" style={{ color: 'var(--dc-p1, #F2F2F2)', fontFamily: 'var(--font-mono, monospace)' }}>
        {period.avgLeadTimeDays > 0 ? `${period.avgLeadTimeDays}d` : '—'}
      </td>
      <td className="py-2.5 px-2 text-center">
        <span className="text-xs font-bold" style={{ color: flowEffColor }}>
          {period.avgLeadTimeDays > 0 ? `${period.flowEfficiencyPct}%` : '—'}
        </span>
      </td>
      <td className="py-2.5 px-2 text-center text-xs" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>
        {period.wipAverage}
        {period.agingWipCount > 0 && (
          <span className="ml-1 font-bold" style={{ color: 'var(--dc-red, #F87171)' }}>({period.agingWipCount}🔴)</span>
        )}
      </td>
      <td className="py-2.5 px-2 text-center text-xs">
        {period.blockedCount > 0 && (
          <span className="chip c-rd mr-1" style={{ fontSize: 10 }}>{period.blockedCount}B</span>
        )}
        {period.reopenedCount > 0 && (
          <span className="chip c-or" style={{ fontSize: 10 }}>{period.reopenedCount}R</span>
        )}
        {period.blockedCount === 0 && period.reopenedCount === 0 && (
          <span style={{ color: 'var(--dc-p3, #505050)' }}>—</span>
        )}
      </td>
      <td className="py-2.5 px-2 text-center text-xs font-bold" style={{ color: bottleneckColor(period.bottleneckStatus) }}>
        {period.bottleneckStatus}
      </td>
      <td className="py-2.5 px-2 pr-4 text-center">
        <span className={`${healthChip(period.flowHealth)}`} style={{ fontSize: 10, borderRadius: 100 }}>
          {period.flowHealth}
        </span>
      </td>
    </tr>
  );
}

interface Props { summary: KanbanFlowSummary }

export default function KanbanThroughputPanel({ summary }: Props) {
  if (!summary.hasKanbanData || !summary.periods.length) {
    return (
      <div className="rounded-2xl p-6 text-sm italic shadow-sm"
        style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr)', color: 'var(--dc-p3, #505050)' }}>
        No Kanban flow data detected. Issues without a <strong>Sprint</strong> field and at least one completed item are analysed here.
      </div>
    );
  }

  const maxThroughput = Math.max(...summary.periods.map(p => p.completedCount), 1);

  const flowEffColor = summary.avgFlowEfficiencyPct > 80
    ? 'var(--dc-acc2, #FF8A4C)'
    : 'var(--dc-amber, #F59E0B)';

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--dc-bdr)', background: 'var(--dc-s1, #141414)' }}>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Kanban Flow</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--dc-p3, #505050)' }}>
            {summary.periods.length} reporting period{summary.periods.length !== 1 ? 's' : ''} · non-sprint issues
          </p>
        </div>
        <span className={`${healthChip(summary.overallFlowHealth)}`} style={{ fontSize: 10, borderRadius: 100 }}>
          {summary.overallFlowHealth}
        </span>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4" style={{ borderBottom: '1px solid var(--dc-bdr)' }}>
        {[
          { label: 'Avg Throughput / Period', value: summary.avgThroughputPerPeriod,  unit: 'issues', color: 'var(--dc-acc2, #FF8A4C)' },
          { label: 'Avg Cycle Time',          value: summary.avgCycleTimeDays > 0 ? `${summary.avgCycleTimeDays}d` : '—', color: 'var(--dc-p1, #F2F2F2)', mono: true },
          { label: 'Avg Lead Time',           value: summary.avgLeadTimeDays > 0 ? `${summary.avgLeadTimeDays}d` : '—',   color: 'var(--dc-p1, #F2F2F2)', mono: true },
          { label: 'Avg Flow Efficiency',     value: summary.avgLeadTimeDays > 0 ? `${summary.avgFlowEfficiencyPct}%` : '—', color: flowEffColor },
        ].map(m => (
          <div key={m.label} className="rounded-xl px-4 py-3"
            style={{ background: 'var(--dc-s1, #141414)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--dc-p3, #505050)' }}>{m.label}</p>
            <p className="text-xl font-black leading-none" style={{ color: m.color, fontFamily: (m as any).mono ? 'var(--font-mono, monospace)' : undefined }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Period table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', background: 'var(--dc-s1, #141414)' }}>
              {['Period', 'Throughput', 'Cycle', 'Lead', 'Flow Eff.', 'WIP (Aging)', 'Blocked / Reopened', 'Bottleneck', 'Health'].map(h => (
                <th key={h} className="py-2 px-2 first:pl-4 last:pr-4 text-[10px] font-bold uppercase tracking-wider text-center first:text-left"
                  style={{ color: 'var(--dc-p3, #505050)' }}>
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
      <div className="px-4 py-3 text-[10px]"
        style={{ borderTop: '1px solid var(--dc-bdr)', background: 'var(--dc-s1, #141414)', color: 'var(--dc-p3, #505050)' }}>
        B = Blocked · R = Reopened · 🔴 = Aging WIP ({'>'}{`14 days active`}) · Flow Eff. = Cycle Time / Lead Time × 100
      </div>
    </div>
  );
}
