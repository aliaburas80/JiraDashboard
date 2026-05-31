// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Sprint comparison panel — select any two sprints for a side-by-side metric breakdown.
'use client';
import { useState } from 'react';
import type { SprintThroughputSummary, SprintThroughput } from '@/types/throughput';

// ── Delta indicator ───────────────────────────────────────────────────────────

type Direction = 'better' | 'worse' | 'same';

function delta(a: number, b: number, higherIsBetter = true): Direction {
  if (a === b) return 'same';
  return (higherIsBetter ? b > a : b < a) ? 'better' : 'worse';
}

function DeltaIcon({ dir }: { dir: Direction }) {
  if (dir === 'better') return <span className="text-green-600 font-black">↑</span>;
  if (dir === 'worse')  return <span className="text-red-500 font-black">↓</span>;
  return <span className="text-slate-300">→</span>;
}

// ── Comparison row ────────────────────────────────────────────────────────────

function Row({
  label, a, b, dir, format = v => String(v), highlight = false,
}: {
  label: string;
  a: number | string;
  b: number | string;
  dir?: Direction;
  format?: (v: number | string) => string;
  highlight?: boolean;
}) {
  const bg = highlight ? 'bg-slate-50' : '';
  const aWins = dir === 'worse';  // b is worse means a is the winner
  const bWins = dir === 'better';

  return (
    <tr className={`border-b border-slate-100 ${bg}`}>
      <td className="py-2 px-3 text-xs text-slate-500 font-semibold whitespace-nowrap">{label}</td>
      <td className={`py-2 px-3 text-sm text-center font-bold ${aWins ? 'text-green-700' : 'text-slate-800'}`}>
        {format(a)}
      </td>
      <td className="py-2 px-3 text-center text-slate-300 text-xs">
        {dir && <DeltaIcon dir={dir} />}
      </td>
      <td className={`py-2 px-3 text-sm text-center font-bold ${bWins ? 'text-green-700' : 'text-slate-800'}`}>
        {format(b)}
      </td>
    </tr>
  );
}

// ── Badge rows (non-numeric) ──────────────────────────────────────────────────

function BadgeRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 px-3 text-xs text-slate-500 font-semibold">{label}</td>
      <td className="py-2 px-3 text-center">
        <span className="text-xs font-bold text-slate-700 bg-slate-100 rounded-full px-2.5 py-0.5">{a || '—'}</span>
      </td>
      <td className="py-2 px-3 text-center text-slate-200 text-xs">vs</td>
      <td className="py-2 px-3 text-center">
        <span className="text-xs font-bold text-slate-700 bg-slate-100 rounded-full px-2.5 py-0.5">{b || '—'}</span>
      </td>
    </tr>
  );
}

// ── Win counter ───────────────────────────────────────────────────────────────

function countWins(a: SprintThroughput, b: SprintThroughput): { aWins: number; bWins: number } {
  const metrics: [number, number, boolean][] = [
    [a.completionPct,       b.completionPct,       true],
    [a.pointCompletionPct,  b.pointCompletionPct,  true],
    [a.throughputByCount,   b.throughputByCount,   true],
    [a.throughputByPoints,  b.throughputByPoints,  true],
    [a.midSprintPct,        b.midSprintPct,        true],
    [a.deliveryConfidence,  b.deliveryConfidence,  true],
    [a.blockedCount,        b.blockedCount,        false],
    [a.carryoverCount,      b.carryoverCount,      false],
  ];
  let aWins = 0; let bWins = 0;
  metrics.forEach(([av, bv, hib]) => {
    if (av === bv) return;
    if (hib ? av > bv : av < bv) aWins++; else bWins++;
  });
  return { aWins, bWins };
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { summary: SprintThroughputSummary }

export default function SprintComparePanel({ summary }: Props) {
  const sprints = summary.sprints;
  const [sprintAName, setSprintAName] = useState(sprints[1]?.sprintName ?? sprints[0]?.sprintName ?? '');
  const [sprintBName, setSprintBName] = useState(sprints[0]?.sprintName ?? '');

  if (sprints.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-sm text-slate-400 italic">
        At least 2 sprints are needed for comparison. Upload a Jira export with multiple sprint groups.
      </div>
    );
  }

  const sprintA = sprints.find(s => s.sprintName === sprintAName);
  const sprintB = sprints.find(s => s.sprintName === sprintBName);
  const canCompare = sprintA && sprintB && sprintAName !== sprintBName;
  const wins = canCompare ? countWins(sprintA, sprintB) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">Sprint Comparison</h3>
          <p className="text-xs text-slate-500 mt-0.5">Select two sprints to compare side-by-side</p>
        </div>
      </div>

      {/* Sprint selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 border-b border-slate-100">
        {/* Sprint A */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Sprint A</label>
          <select value={sprintAName} onChange={e => setSprintAName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300">
            {sprints.map(s => <option key={s.sprintName} value={s.sprintName}>{s.sprintName}</option>)}
          </select>
        </div>

        {/* vs badge */}
        <div className="flex items-end justify-center pb-2">
          <span className="text-xs font-black text-slate-400 bg-slate-100 rounded-full px-3 py-1.5">VS</span>
        </div>

        {/* Sprint B */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Sprint B</label>
          <select value={sprintBName} onChange={e => setSprintBName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300">
            {sprints.map(s => <option key={s.sprintName} value={s.sprintName}>{s.sprintName}</option>)}
          </select>
        </div>
      </div>

      {/* Same sprint warning */}
      {sprintAName === sprintBName && (
        <div className="px-6 py-4 text-sm text-amber-700 bg-amber-50 border-b border-amber-200">
          Select two different sprints to compare.
        </div>
      )}

      {/* Comparison table */}
      {canCompare && (
        <>
          {/* Win summary */}
          {wins && (
            <div className="grid grid-cols-3 gap-0 border-b border-slate-100">
              <div className={`p-3 text-center border-r border-slate-100 ${wins.aWins > wins.bWins ? 'bg-green-50' : ''}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate" title={sprintAName}>{sprintAName}</p>
                <p className={`text-2xl font-black ${wins.aWins > wins.bWins ? 'text-green-700' : 'text-slate-500'}`}>{wins.aWins}</p>
                <p className="text-[10px] text-slate-400">metrics won</p>
              </div>
              <div className="p-3 text-center flex flex-col items-center justify-center">
                {wins.aWins === wins.bWins
                  ? <><p className="text-lg font-black text-slate-400">Tie</p><p className="text-[10px] text-slate-400">Even match</p></>
                  : <><p className="text-xs font-black text-green-700">{wins.aWins > wins.bWins ? sprintAName : sprintBName}</p><p className="text-[10px] text-slate-400">wins overall</p></>
                }
              </div>
              <div className={`p-3 text-center border-l border-slate-100 ${wins.bWins > wins.aWins ? 'bg-green-50' : ''}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate" title={sprintBName}>{sprintBName}</p>
                <p className={`text-2xl font-black ${wins.bWins > wins.aWins ? 'text-green-700' : 'text-slate-500'}`}>{wins.bWins}</p>
                <p className="text-[10px] text-slate-400">metrics won</p>
              </div>
            </div>
          )}

          {/* Metric rows */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-left w-36">Metric</th>
                  <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-center truncate max-w-[140px]" title={sprintAName}>
                    {sprintAName.length > 16 ? sprintAName.slice(0, 16) + '…' : sprintAName}
                  </th>
                  <th className="py-2 px-3 w-8" />
                  <th className="py-2 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-center truncate max-w-[140px]" title={sprintBName}>
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
                <Row label="Delivery Confidence" a={sprintA.deliveryConfidence}  b={sprintB.deliveryConfidence}  dir={delta(sprintA.deliveryConfidence,  sprintB.deliveryConfidence)}  format={v => `${v}%`} highlight />
                <BadgeRow label="Goal Outcome"   a={sprintA.goalOutcome}        b={sprintB.goalOutcome} />
                <BadgeRow label="Pattern"        a={sprintA.deliveryPattern}    b={sprintB.deliveryPattern} />
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 text-xs text-slate-400">
            <span><span className="text-green-600 font-black">↑</span> Better</span>
            <span><span className="text-red-500 font-black">↓</span> Worse</span>
            <span><span className="text-slate-300">→</span> Same</span>
            <span className="text-green-700 font-bold ml-2">Green value = winner</span>
          </div>
        </>
      )}
    </div>
  );
}
