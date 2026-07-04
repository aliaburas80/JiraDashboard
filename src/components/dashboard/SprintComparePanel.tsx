// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Sprint comparison panel — select any two sprints for a side-by-side metric breakdown.
'use client';
import { useState } from 'react';
import type { SprintThroughputSummary, SprintThroughput } from '@/types/throughput';

type Direction = 'better' | 'worse' | 'same';

function delta(a: number, b: number, higherIsBetter = true): Direction {
  if (a === b) return 'same';
  return (higherIsBetter ? b > a : b < a) ? 'better' : 'worse';
}

function DeltaIcon({ dir }: { dir: Direction }) {
  if (dir === 'better') return <span className="font-black" style={{ color: 'var(--dc-green, #22C55E)' }}>↑</span>;
  if (dir === 'worse')  return <span className="font-black" style={{ color: 'var(--dc-red, #F87171)' }}>↓</span>;
  return <span style={{ color: 'var(--dc-p3, #505050)' }}>→</span>;
}

function Row({
  label, a, b, dir, format = v => String(v), highlight = false,
}: {
  label: string; a: number | string; b: number | string;
  dir?: Direction; format?: (v: number | string) => string; highlight?: boolean;
}) {
  const aWins = dir === 'worse';
  const bWins = dir === 'better';
  return (
    <tr style={{
      borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
      background: highlight ? 'var(--dc-s1, #141414)' : 'transparent',
    }}>
      <td className="py-2 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--dc-p2, #909090)' }}>{label}</td>
      <td className="py-2 px-3 text-sm text-center font-bold"
        style={{ color: aWins ? 'var(--dc-green, #22C55E)' : 'var(--dc-p1, #F2F2F2)' }}>
        {format(a)}
      </td>
      <td className="py-2 px-3 text-center text-xs">
        {dir && <DeltaIcon dir={dir} />}
      </td>
      <td className="py-2 px-3 text-sm text-center font-bold"
        style={{ color: bWins ? 'var(--dc-green, #22C55E)' : 'var(--dc-p1, #F2F2F2)' }}>
        {format(b)}
      </td>
    </tr>
  );
}

function BadgeRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
      <td className="py-2 px-3 text-xs font-semibold" style={{ color: 'var(--dc-p2, #909090)' }}>{label}</td>
      <td className="py-2 px-3 text-center">
        <span className="chip c-nt" style={{ fontSize: 10 }}>{a || '—'}</span>
      </td>
      <td className="py-2 px-3 text-center text-xs" style={{ color: 'var(--dc-p3, #505050)' }}>vs</td>
      <td className="py-2 px-3 text-center">
        <span className="chip c-nt" style={{ fontSize: 10 }}>{b || '—'}</span>
      </td>
    </tr>
  );
}

function countWins(a: SprintThroughput, b: SprintThroughput): { aWins: number; bWins: number } {
  const metrics: [number, number, boolean][] = [
    [a.completionPct,      b.completionPct,      true],
    [a.pointCompletionPct, b.pointCompletionPct, true],
    [a.throughputByCount,  b.throughputByCount,  true],
    [a.throughputByPoints, b.throughputByPoints, true],
    [a.midSprintPct,       b.midSprintPct,       true],
    [a.deliveryConfidence, b.deliveryConfidence, true],
    [a.blockedCount,       b.blockedCount,       false],
    [a.carryoverCount,     b.carryoverCount,     false],
  ];
  let aWins = 0; let bWins = 0;
  metrics.forEach(([av, bv, hib]) => {
    if (av === bv) return;
    if (hib ? av > bv : av < bv) aWins++; else bWins++;
  });
  return { aWins, bWins };
}

interface Props { summary: SprintThroughputSummary }

export default function SprintComparePanel({ summary }: Props) {
  const sprints = summary.sprints;
  const [sprintAName, setSprintAName] = useState(sprints[1]?.sprintName ?? sprints[0]?.sprintName ?? '');
  const [sprintBName, setSprintBName] = useState(sprints[0]?.sprintName ?? '');

  if (sprints.length < 2) {
    return (
      <div className="rounded-2xl p-6 shadow-sm text-sm italic"
        style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr)', color: 'var(--dc-p3, #505050)' }}>
        At least 2 sprints are needed for comparison.
      </div>
    );
  }

  const sprintA = sprints.find(s => s.sprintName === sprintAName);
  const sprintB = sprints.find(s => s.sprintName === sprintBName);
  const canCompare = sprintA && sprintB && sprintAName !== sprintBName;
  const wins = canCompare ? countWins(sprintA, sprintB) : null;

  const inputStyle = {
    background: 'var(--dc-s3, #282828)',
    border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
    borderRadius: 10,
    color: 'var(--dc-p1, #F2F2F2)',
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    fontWeight: 600,
    outline: 'none',
  } as React.CSSProperties;

  return (
    <div className="rounded-2xl shadow-sm overflow-hidden"
      style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--dc-bdr)', background: 'var(--dc-s1, #141414)' }}>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Sprint Comparison</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--dc-p3, #505050)' }}>Select two sprints to compare side-by-side</p>
        </div>
      </div>

      {/* Sprint selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5"
        style={{ borderBottom: '1px solid var(--dc-bdr)' }}>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--dc-p3, #505050)' }}>Sprint A</label>
          <select value={sprintAName} onChange={e => setSprintAName(e.target.value)} style={inputStyle}>
            {sprints.map(s => <option key={s.sprintName} value={s.sprintName}>{s.sprintName}</option>)}
          </select>
        </div>
        <div className="flex items-end justify-center pb-2">
          <span className="text-xs font-black rounded-full px-3 py-1.5"
            style={{ background: 'var(--dc-s3, #282828)', color: 'var(--dc-p2, #909090)' }}>VS</span>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--dc-p3, #505050)' }}>Sprint B</label>
          <select value={sprintBName} onChange={e => setSprintBName(e.target.value)} style={inputStyle}>
            {sprints.map(s => <option key={s.sprintName} value={s.sprintName}>{s.sprintName}</option>)}
          </select>
        </div>
      </div>

      {/* Same sprint warning */}
      {sprintAName === sprintBName && (
        <div className="px-6 py-4 text-sm" style={{ color: 'var(--dc-amber, #F59E0B)', background: 'rgba(245,158,11,0.07)', borderBottom: '1px solid rgba(245,158,11,0.18)' }}>
          Select two different sprints to compare.
        </div>
      )}

      {canCompare && wins && (
        <>
          {/* Win summary */}
          <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid var(--dc-bdr)' }}>
            {/* Sprint A score */}
            <div className="p-3 text-center" style={{
              borderRight: '1px solid var(--dc-bdr)',
              background: wins.aWins > wins.bWins ? 'rgba(34,197,94,0.08)' : 'var(--dc-s1, #141414)',
              ...(wins.aWins > wins.bWins ? { border: '1px solid rgba(34,197,94,0.15)' } : {}),
            }}>
              <p className="text-[10px] font-black uppercase tracking-wider truncate" style={{ color: 'var(--dc-p3, #505050)' }} title={sprintAName}>{sprintAName}</p>
              <p className="text-2xl font-black" style={{ color: wins.aWins > wins.bWins ? 'var(--dc-green, #22C55E)' : 'var(--dc-p2, #909090)', fontFamily: 'var(--font-mono, monospace)' }}>{wins.aWins}</p>
              <p className="text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>metrics won</p>
            </div>
            {/* Center label */}
            <div className="p-3 text-center flex flex-col items-center justify-center">
              {wins.aWins === wins.bWins
                ? <><p className="text-lg font-black" style={{ color: 'var(--dc-p2, #909090)' }}>Tie</p><p className="text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>Even match</p></>
                : <><p className="text-xs font-black" style={{ color: 'var(--dc-green, #22C55E)' }}>{wins.aWins > wins.bWins ? sprintAName : sprintBName}</p><p className="text-[10px] font-bold" style={{ color: 'var(--dc-green, #22C55E)' }}>wins overall</p></>
              }
            </div>
            {/* Sprint B score */}
            <div className="p-3 text-center" style={{
              borderLeft: '1px solid var(--dc-bdr)',
              background: wins.bWins > wins.aWins ? 'rgba(34,197,94,0.08)' : 'var(--dc-s1, #141414)',
              ...(wins.bWins > wins.aWins ? { border: '1px solid rgba(34,197,94,0.15)' } : {}),
            }}>
              <p className="text-[10px] font-black uppercase tracking-wider truncate" style={{ color: 'var(--dc-p3, #505050)' }} title={sprintBName}>{sprintBName}</p>
              <p className="text-2xl font-black" style={{ color: wins.bWins > wins.aWins ? 'var(--dc-green, #22C55E)' : 'var(--dc-p2, #909090)', fontFamily: 'var(--font-mono, monospace)' }}>{wins.bWins}</p>
              <p className="text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>metrics won</p>
            </div>
          </div>

          {/* Metric rows */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', background: 'var(--dc-s1, #141414)' }}>
                  <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-left w-36" style={{ color: 'var(--dc-p3, #505050)' }}>Metric</th>
                  <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-center truncate max-w-[140px]" style={{ color: 'var(--dc-p3, #505050)' }} title={sprintAName}>
                    {sprintAName.length > 16 ? sprintAName.slice(0, 16) + '…' : sprintAName}
                  </th>
                  <th className="py-2 px-3 w-8" />
                  <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-center truncate max-w-[140px]" style={{ color: 'var(--dc-p3, #505050)' }} title={sprintBName}>
                    {sprintBName.length > 16 ? sprintBName.slice(0, 16) + '…' : sprintBName}
                  </th>
                </tr>
              </thead>
              <tbody>
                <Row label="Completion %"        a={sprintA.completionPct}      b={sprintB.completionPct}      dir={delta(sprintA.completionPct,      sprintB.completionPct)}      format={v => `${v}%`} highlight />
                <Row label="SP Completion %"     a={sprintA.pointCompletionPct} b={sprintB.pointCompletionPct} dir={delta(sprintA.pointCompletionPct, sprintB.pointCompletionPct)} format={v => `${v}%`} />
                <Row label="Issues Done"         a={sprintA.completedCount}     b={sprintB.completedCount}     dir={delta(sprintA.completedCount,     sprintB.completedCount)}     highlight />
                <Row label="Issues Committed"    a={sprintA.committedCount}     b={sprintB.committedCount}     />
                <Row label="SP Done"             a={sprintA.completedPoints}    b={sprintB.completedPoints}    dir={delta(sprintA.completedPoints,    sprintB.completedPoints)}    highlight />
                <Row label="SP Committed"        a={sprintA.committedPoints}    b={sprintB.committedPoints}    />
                <Row label="Mid-Sprint %"        a={sprintA.midSprintPct}       b={sprintB.midSprintPct}       dir={delta(sprintA.midSprintPct,       sprintB.midSprintPct)}       format={v => sprintA.sprintMidpoint && sprintB.sprintMidpoint ? `${v}%` : '—'} highlight />
                <Row label="Blocked Items"       a={sprintA.blockedCount}       b={sprintB.blockedCount}       dir={delta(sprintA.blockedCount,       sprintB.blockedCount, false)} />
                <Row label="Carryover"           a={sprintA.carryoverCount}     b={sprintB.carryoverCount}     dir={delta(sprintA.carryoverCount,     sprintB.carryoverCount, false)} highlight />
                <Row label="Added Scope"         a={sprintA.addedScopeCount}    b={sprintB.addedScopeCount}    dir={delta(sprintA.addedScopeCount,    sprintB.addedScopeCount, false)} />
                <Row label="Bugs Completed"      a={sprintA.bugsCompleted}      b={sprintB.bugsCompleted}      dir={delta(sprintA.bugsCompleted,      sprintB.bugsCompleted)}      highlight />
                <Row label="Bugs Open"           a={sprintA.bugsOpen}           b={sprintB.bugsOpen}           dir={delta(sprintA.bugsOpen,           sprintB.bugsOpen, false)} />
                <Row label="Delivery Confidence" a={sprintA.deliveryConfidence} b={sprintB.deliveryConfidence} dir={delta(sprintA.deliveryConfidence,  sprintB.deliveryConfidence)} format={v => `${v}%`} highlight />
                <BadgeRow label="Goal Outcome"   a={sprintA.goalOutcome}        b={sprintB.goalOutcome} />
                <BadgeRow label="Pattern"        a={sprintA.deliveryPattern}    b={sprintB.deliveryPattern} />
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 flex flex-wrap gap-4 text-xs"
            style={{ borderTop: '1px solid var(--dc-bdr)', background: 'var(--dc-s1, #141414)', color: 'var(--dc-p3, #505050)' }}>
            <span><span className="font-black" style={{ color: 'var(--dc-green, #22C55E)' }}>↑</span> Better</span>
            <span><span className="font-black" style={{ color: 'var(--dc-red, #F87171)' }}>↓</span> Worse</span>
            <span><span style={{ color: 'var(--dc-p3, #505050)' }}>→</span> Same</span>
            <span className="font-bold ml-2" style={{ color: 'var(--dc-green, #22C55E)' }}>Green value = winner</span>
          </div>
        </>
      )}
    </div>
  );
}
