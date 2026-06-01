// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// "What changed since last upload?" panel.
// Fetches the 2 most recent upload logs and compares them automatically.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { TrendPoint } from '@/types/trends';

// ── Change entry ──────────────────────────────────────────────────────────────

interface Change {
  label:  string;
  prev:   string;
  curr:   string;
  delta:  string;
  dir:    'improved' | 'declined' | 'stable';
}

function ChangeRow({ change }: { change: Change }) {
  const icon  = change.dir === 'improved' ? '↑' : change.dir === 'declined' ? '↓' : '→';
  const color = change.dir === 'improved' ? 'text-green-700 bg-green-50 border-green-200'
              : change.dir === 'declined' ? 'text-red-700 bg-red-50 border-red-200'
              : 'text-slate-500 bg-slate-50 border-slate-200';

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`shrink-0 text-[10px] font-black w-5 h-5 rounded-full border flex items-center justify-center ${color}`}>
        {icon}
      </span>
      <span className="text-xs font-semibold text-slate-700 flex-1">{change.label}</span>
      <span className="text-xs text-slate-400">{change.prev} →</span>
      <span className={`text-xs font-bold ${change.dir === 'improved' ? 'text-green-700' : change.dir === 'declined' ? 'text-red-700' : 'text-slate-500'}`}>
        {change.curr}
      </span>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
        {change.delta}
      </span>
    </div>
  );
}

// ── Diff builder ──────────────────────────────────────────────────────────────

function buildChanges(prev: TrendPoint, curr: TrendPoint): Change[] {
  const changes: Change[] = [];

  function add(
    label: string, prevVal: number, currVal: number,
    unit: string, higherIsBetter = true, threshold = 0.5,
  ) {
    const delta = currVal - prevVal;
    if (Math.abs(delta) < threshold) return;
    const dir: Change['dir'] = (delta > 0 && higherIsBetter) || (delta < 0 && !higherIsBetter)
      ? 'improved' : 'declined';
    const sign = delta > 0 ? '+' : '';
    changes.push({
      label,
      prev:  `${Math.round(prevVal * 10) / 10}${unit}`,
      curr:  `${Math.round(currVal * 10) / 10}${unit}`,
      delta: `${sign}${Math.round(delta * 10) / 10}${unit}`,
      dir,
    });
  }

  add('Health Score',    prev.healthScore,    curr.healthScore,    '/100', true,  1);
  add('Completion',      prev.completionRate, curr.completionRate, '%',    true,  1);
  add('Done Issues',     prev.doneIssues,     curr.doneIssues,     '',     true,  1);
  add('Total Issues',    prev.totalIssues,    curr.totalIssues,    '',     true,  1);
  add('Blocked Items',   prev.blockedIssues,  curr.blockedIssues,  '',     false, 1);
  add('Critical Items',  prev.criticalCount,  curr.criticalCount,  '',     false, 1);
  add('Open Defects',    prev.openDefects,    curr.openDefects,    '',     false, 1);
  add('Avg Lead Time',   prev.avgLeadTimeDays,  curr.avgLeadTimeDays,  'd', false, 0.5);
  add('Avg Cycle Time',  prev.avgCycleTimeDays, curr.avgCycleTimeDays, 'd', false, 0.5);

  if (prev.dataQualityScore != null && curr.dataQualityScore != null) {
    add('Data Quality',  prev.dataQualityScore, curr.dataQualityScore, '%', true, 2);
  }

  return changes;
}

function buildNarrative(prev: TrendPoint, curr: TrendPoint, changes: Change[]): string {
  if (changes.length === 0) return 'Metrics are broadly the same as the previous upload.';

  const parts: string[] = [];
  const compDelta = curr.completionRate - prev.completionRate;
  const doneDelta = curr.doneIssues - prev.doneIssues;
  const blockedDelta = curr.blockedIssues - prev.blockedIssues;
  const scoreDelta = curr.healthScore - prev.healthScore;

  if (Math.abs(doneDelta) >= 1) {
    parts.push(`${Math.abs(doneDelta)} item${Math.abs(doneDelta) !== 1 ? 's' : ''} ${doneDelta > 0 ? 'completed' : 'moved back to open'}`);
  }
  if (Math.abs(compDelta) >= 1) {
    parts.push(`completion ${compDelta > 0 ? 'up' : 'down'} ${Math.abs(Math.round(compDelta))}%`);
  }
  if (blockedDelta !== 0) {
    parts.push(`${Math.abs(blockedDelta)} ${blockedDelta > 0 ? 'new' : 'fewer'} blocked item${Math.abs(blockedDelta) !== 1 ? 's' : ''}`);
  }
  if (Math.abs(scoreDelta) >= 2) {
    parts.push(`health score ${scoreDelta > 0 ? 'improved' : 'dropped'} by ${Math.abs(Math.round(scoreDelta))} points`);
  }

  return parts.length > 0 ? parts.join(', ') + '.' : 'Minor metric changes detected.';
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { collapsed?: boolean }

export default function WhatChangedPanel({ collapsed = false }: Props) {
  const [prev, setPrev]   = useState<TrendPoint | null>(null);
  const [curr, setCurr]   = useState<TrendPoint | null>(null);
  const [open, setOpen]   = useState(!collapsed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/trends?last=2')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.points || data.points.length < 2) return;
        const pts = data.points as TrendPoint[];
        setPrev(pts[pts.length - 2]);
        setCurr(pts[pts.length - 1]);
        setReady(true);
      })
      .catch(() => {});
  }, []);

  // Don't render if not logged in, no history, or same upload
  if (!ready || !prev || !curr) return null;
  if (prev.id === curr.id) return null;

  const changes  = buildChanges(prev, curr);
  const narrative = buildNarrative(prev, curr, changes);
  const improved  = changes.filter(c => c.dir === 'improved').length;
  const declined  = changes.filter(c => c.dir === 'declined').length;

  const prevDate = new Date(prev.uploadedAt).toLocaleDateString();
  const daysDiff = Math.round((new Date(curr.uploadedAt).getTime() - new Date(prev.uploadedAt).getTime()) / 86_400_000);
  const timeAgo  = daysDiff === 0 ? 'today' : daysDiff === 1 ? 'yesterday' : `${daysDiff} days ago`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-5">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🔄</span>
          <div>
            <p className="text-sm font-black text-slate-800">What changed since last upload?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              vs <span className="font-semibold">{prev.fileName}</span> ({timeAgo} · {prevDate})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {improved > 0 && (
            <span className="text-[10px] font-bold bg-green-100 text-green-800 border border-green-200 rounded-full px-2 py-0.5">
              ↑ {improved} improved
            </span>
          )}
          {declined > 0 && (
            <span className="text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 rounded-full px-2 py-0.5">
              ↓ {declined} declined
            </span>
          )}
          {changes.length === 0 && (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
              No change
            </span>
          )}
          <span className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div className="px-5 pb-4 border-t border-slate-100">
          {/* Narrative */}
          <p className="text-xs text-slate-600 italic py-3 border-b border-slate-100 mb-3">
            {narrative}
          </p>

          {/* Changes */}
          {changes.length > 0 ? (
            <div className="space-y-0.5">
              {changes.map((c, i) => <ChangeRow key={i} change={c} />)}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-3">
              All metrics within the normal variation threshold (±0.5).
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              {curr.totalIssues} issues · health {curr.healthScore}/100
            </p>
            <Link href="/trends" className="text-[10px] font-bold text-blue-600 hover:underline">
              View all trends →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
