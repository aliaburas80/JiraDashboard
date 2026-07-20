// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Snapshot comparison — select two saved snapshots and compare metrics side-by-side.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import LoadingState from '@/components/ui/LoadingState';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { DashboardMetrics } from '@/types/metrics';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SnapshotMeta { id: string; snapshotName: string; createdAt: string }
interface LoadedSnap   { meta: SnapshotMeta; metrics: DashboardMetrics }

// ── Delta helpers ─────────────────────────────────────────────────────────────

type Direction = 'better' | 'worse' | 'same';

function delta(a: number, b: number, higherIsBetter = true): Direction {
  if (Math.abs(a - b) < 0.01) return 'same';
  return (higherIsBetter ? b > a : b < a) ? 'better' : 'worse';
}

function DeltaChip({ dir, value }: { dir: Direction; value: number | string }) {
  const cfg = {
    better: { cls: 'bg-green-100 text-green-800 border-green-200', icon: '↑' },
    worse:  { cls: 'bg-red-100 text-red-800 border-red-200',       icon: '↓' },
    same:   { cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: '→' },
  }[dir];
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.cls}`}>
      {cfg.icon} {value}
    </span>
  );
}

// ── Comparison row ────────────────────────────────────────────────────────────

function Row({
  label, aVal, bVal, aNum, bNum, higherIsBetter = true, suffix = '',
}: {
  label: string; aVal: string; bVal: string; aNum: number; bNum: number;
  higherIsBetter?: boolean; suffix?: string;
}) {
  const dir = delta(aNum, bNum, higherIsBetter);
  const num  = bNum - aNum;
  const sign = num > 0 ? '+' : '';
  const display = Math.abs(num) < 0.01 ? '—' : `${sign}${Math.round(num * 10) / 10}${suffix}`;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="py-2.5 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap">{label}</td>
      <td className={`py-2.5 px-4 text-sm text-center font-bold ${dir === 'worse' ? 'text-green-700' : 'text-slate-800'}`}>
        {aVal}
      </td>
      <td className="py-2.5 px-4 text-center">
        {display !== '—' ? <DeltaChip dir={dir} value={display} /> : <span className="text-slate-300 text-xs">—</span>}
      </td>
      <td className={`py-2.5 px-4 text-sm text-center font-bold ${dir === 'better' ? 'text-green-700' : 'text-slate-800'}`}>
        {bVal}
      </td>
    </tr>
  );
}

// ── Insight generator ─────────────────────────────────────────────────────────

function buildInsights(a: DashboardMetrics, b: DashboardMetrics, aName: string, bName: string): string[] {
  const ins: string[] = [];
  const flowA = (a.flow ?? {}) as any;
  const flowB = (b.flow ?? {}) as any;

  const compDelta  = (b.completionRate ?? 0) - (a.completionRate ?? 0);
  const scoreDelta = (b.healthScore ?? 0) - (a.healthScore ?? 0);
  const blockedDelta = (b.blockedIssues ?? 0) - (a.blockedIssues ?? 0);
  const leadDelta  = (flowB.averageLeadTimeDays ?? 0) - (flowA.averageLeadTimeDays ?? 0);

  if (Math.abs(compDelta) >= 1) {
    ins.push(`Completion ${compDelta > 0 ? 'improved' : 'decreased'} by ${Math.abs(Math.round(compDelta))}% between "${aName}" and "${bName}".`);
  }
  if (Math.abs(scoreDelta) >= 2) {
    ins.push(`Health score ${scoreDelta > 0 ? 'improved' : 'dropped'} by ${Math.abs(Math.round(scoreDelta))} points.`);
  }
  if (blockedDelta !== 0) {
    ins.push(`Blocked items ${blockedDelta > 0 ? 'increased by ' + blockedDelta : 'reduced by ' + Math.abs(blockedDelta)} — ${blockedDelta > 0 ? 'needs attention' : 'positive sign'}.`);
  }
  if (Math.abs(leadDelta) >= 0.5) {
    ins.push(`Average lead time ${leadDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(leadDelta * 10) / 10)} days.`);
  }
  if (ins.length === 0) ins.push(`Metrics are broadly similar between "${aName}" and "${bName}".`);
  return ins;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SnapshotComparePage() {
  const router = useRouter();
  const [snaps, setSnaps]   = useState<SnapshotMeta[]>([]);
  const [idA, setIdA]       = useState('');
  const [idB, setIdB]       = useState('');
  const [snapA, setSnapA]   = useState<LoadedSnap | null>(null);
  const [snapB, setSnapB]   = useState<LoadedSnap | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me) { router.replace('/login'); return; }
        return fetch('/api/snapshots').then(r => r.json());
      })
      .then(data => {
        if (data?.snapshots) {
          setSnaps(data.snapshots);
          if (data.snapshots.length >= 2) {
            setIdA(data.snapshots[1].id);
            setIdB(data.snapshots[0].id);
          }
        }
      })
      .catch(() => setError('Failed to load snapshots.'))
      .finally(() => setLoading(false));
  }, [router]);

  async function loadSnap(id: string): Promise<LoadedSnap | null> {
    const res  = await fetch(`/api/snapshots/${id}`);
    const data = await res.json();
    if (!res.ok) return null;
    const meta = snaps.find(s => s.id === id)!;
    return { meta, metrics: JSON.parse(data.metricsJson) };
  }

  async function handleCompare() {
    if (!idA || !idB || idA === idB) {
      setError('Select two different snapshots.'); return;
    }
    setComparing(true); setError(''); setSnapA(null); setSnapB(null);
    try {
      const [a, b] = await Promise.all([loadSnap(idA), loadSnap(idB)]);
      if (!a || !b) { setError('Failed to load one or both snapshots.'); return; }
      setSnapA(a); setSnapB(b);
    } catch { setError('Comparison failed. Please try again.'); }
    finally { setComparing(false); }
  }

  if (loading) return <AppShell showNav><LoadingState message="Loading…" /></AppShell>;

  const canCompare = snaps.length >= 2;
  const a = snapA?.metrics;
  const b = snapB?.metrics;
  const flowA = (a?.flow ?? {}) as any;
  const flowB = (b?.flow ?? {}) as any;
  const spA   = (a?.storyPoints ?? {}) as any;
  const spB   = (b?.storyPoints ?? {}) as any;
  const tpA   = a?.throughput?.sprint;
  const tpB   = b?.throughput?.sprint;

  const insights = a && b
    ? buildInsights(a, b, snapA!.meta.snapshotName, snapB!.meta.snapshotName)
    : [];

  const scoreA = a?.healthScore ?? 0;
  const scoreB = b?.healthScore ?? 0;
  const overallDir = delta(scoreA, scoreB);

  // Detect if both snapshots appear to be from the same data
  const isSameData = a && b && (
    a.healthScore    === b.healthScore &&
    a.completionRate === b.completionRate &&
    a.totalIssues    === b.totalIssues &&
    a.doneIssues     === b.doneIssues
  );

  return (
    <AppShell showNav>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Snapshot Comparison</h1>
            <p className="text-sm text-slate-500 mt-1">Select two saved snapshots to compare metrics side-by-side.</p>
          </div>
          <button type="button" onClick={() => router.push('/snapshots')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            ← All Snapshots
          </button>
        </div>

        {!canCompare && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-base font-black text-amber-800 mb-2">Need at least 2 snapshots</p>
            <p className="text-sm text-amber-700 mb-4">Save a few named snapshots from the dashboard first, then come back to compare them.</p>
            <button type="button" onClick={() => router.push('/dashboard')}
              className="btn-primary px-5 py-2.5 bg-amber-600 hover:bg-amber-700">
              Go to Dashboard →
            </button>
          </div>
        )}

        {canCompare && (
          <>
            {/* Guidance */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-xs text-blue-800">
              <strong>How it works:</strong> Save snapshots at <strong>different points in time</strong> — end of sprint, weekly review, before/after a release. Comparing snapshots from the same upload will show no change.
            </div>

            {/* Snapshot selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Snapshot A (baseline)</label>
                <select value={idA} onChange={e => setIdA(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300">
                  {snaps.map(s => (
                    <option key={s.id} value={s.id}>{s.snapshotName} — {new Date(s.createdAt).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end justify-center pb-2">
                <span className="text-xs font-black text-slate-400 bg-slate-100 rounded-full px-3 py-1.5">VS</span>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Snapshot B (comparison)</label>
                <select value={idB} onChange={e => setIdB(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300">
                  {snaps.map(s => (
                    <option key={s.id} value={s.id}>{s.snapshotName} — {new Date(s.createdAt).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>}

            <button type="button" onClick={handleCompare} disabled={comparing || idA === idB}
              className="w-full btn-primary py-3 mb-6 disabled:opacity-40">
              {comparing ? 'Comparing…' : 'Compare Snapshots →'}
            </button>
          </>
        )}

        {/* Results */}
        {a && b && snapA && snapB && (
          <>
            {/* Same-data warning */}
            {isSameData && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 mb-5 flex items-start gap-3">
                <SvgIcon name="warning" size={20} className="shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-black text-amber-900">These snapshots appear to contain the same data</p>
                  <p className="text-xs text-amber-700 mt-1 leading-snug">
                    Both snapshots have identical metrics — they were likely saved from the same Jira upload on the same day.
                    For a meaningful comparison, save one snapshot now and another after uploading a newer Jira export (e.g. next sprint end).
                  </p>
                </div>
              </div>
            )}

            {/* Win summary */}
            <div className={`flex items-center gap-4 rounded-2xl border px-6 py-4 mb-5 ${
              overallDir === 'better' ? 'bg-green-50 border-green-200' :
              overallDir === 'worse'  ? 'bg-red-50 border-red-200'   : 'bg-slate-50 border-slate-200'
            }`}>
              <SvgIcon
                name={overallDir === 'better' ? 'chartTrendUp' : overallDir === 'worse' ? 'chartTrendDown' : 'changes'}
                size={24}
                className={overallDir === 'better' ? 'text-green-700' : overallDir === 'worse' ? 'text-red-700' : 'text-slate-500'}
              />
              <div>
                <p className={`text-sm font-black ${overallDir === 'better' ? 'text-green-800' : overallDir === 'worse' ? 'text-red-800' : 'text-slate-700'}`}>
                  {overallDir === 'better' ? `Delivery improved between snapshots`
                   : overallDir === 'worse'  ? `Delivery declined between snapshots`
                   : `Delivery is broadly stable between snapshots`}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {insights.map((i, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Comparison table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-left w-40">Metric</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-center">
                      <span className="block font-black text-slate-800 text-xs truncate max-w-[140px] mx-auto" title={snapA.meta.snapshotName}>
                        {snapA.meta.snapshotName.length > 18 ? snapA.meta.snapshotName.slice(0, 18) + '…' : snapA.meta.snapshotName}
                      </span>
                      <span className="text-[9px] text-slate-400">{new Date(snapA.meta.createdAt).toLocaleDateString()}</span>
                    </th>
                    <th className="py-3 px-4 text-center w-24 text-[10px] font-black uppercase tracking-wider text-slate-500">Change</th>
                    <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-center">
                      <span className="block font-black text-slate-800 text-xs truncate max-w-[140px] mx-auto" title={snapB.meta.snapshotName}>
                        {snapB.meta.snapshotName.length > 18 ? snapB.meta.snapshotName.slice(0, 18) + '…' : snapB.meta.snapshotName}
                      </span>
                      <span className="text-[9px] text-slate-400">{new Date(snapB.meta.createdAt).toLocaleDateString()}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="Health Score"    aVal={`${scoreA}/100`} bVal={`${scoreB}/100`} aNum={scoreA} bNum={scoreB} />
                  <Row label="Completion %"    aVal={`${a.completionRate ?? 0}%`} bVal={`${b.completionRate ?? 0}%`} aNum={a.completionRate ?? 0} bNum={b.completionRate ?? 0} suffix="%" />
                  <Row label="Total Issues"    aVal={String(a.totalIssues ?? 0)} bVal={String(b.totalIssues ?? 0)} aNum={a.totalIssues ?? 0} bNum={b.totalIssues ?? 0} />
                  <Row label="Done Issues"     aVal={String(a.doneIssues ?? 0)} bVal={String(b.doneIssues ?? 0)} aNum={a.doneIssues ?? 0} bNum={b.doneIssues ?? 0} />
                  <Row label="Active Issues"   aVal={String(a.activeIssues ?? 0)} bVal={String(b.activeIssues ?? 0)} aNum={a.activeIssues ?? 0} bNum={b.activeIssues ?? 0} higherIsBetter={false} />
                  <Row label="Blocked Items"   aVal={String(a.blockedIssues ?? 0)} bVal={String(b.blockedIssues ?? 0)} aNum={a.blockedIssues ?? 0} bNum={b.blockedIssues ?? 0} higherIsBetter={false} />
                  <Row label="Open Defects"    aVal={String(a.openDefects ?? 0)} bVal={String(b.openDefects ?? 0)} aNum={a.openDefects ?? 0} bNum={b.openDefects ?? 0} higherIsBetter={false} />
                  <Row label="Avg Lead Time"   aVal={`${flowA.averageLeadTimeDays ?? 0}d`} bVal={`${flowB.averageLeadTimeDays ?? 0}d`} aNum={flowA.averageLeadTimeDays ?? 0} bNum={flowB.averageLeadTimeDays ?? 0} higherIsBetter={false} suffix="d" />
                  <Row label="Avg Cycle Time"  aVal={`${flowA.averageCycleTimeDays ?? 0}d`} bVal={`${flowB.averageCycleTimeDays ?? 0}d`} aNum={flowA.averageCycleTimeDays ?? 0} bNum={flowB.averageCycleTimeDays ?? 0} higherIsBetter={false} suffix="d" />
                  {(spA.totalStoryPoints > 0 || spB.totalStoryPoints > 0) && (
                    <Row label="SP Completion %" aVal={`${spA.pointCompletionRate ?? 0}%`} bVal={`${spB.pointCompletionRate ?? 0}%`} aNum={spA.pointCompletionRate ?? 0} bNum={spB.pointCompletionRate ?? 0} suffix="%" />
                  )}
                  {(tpA || tpB) && (
                    <Row label="Avg Sprint TP"  aVal={String(tpA?.averageThroughputCount ?? 0)} bVal={String(tpB?.averageThroughputCount ?? 0)} aNum={tpA?.averageThroughputCount ?? 0} bNum={tpB?.averageThroughputCount ?? 0} />
                  )}
                  <Row label="Critical Items"  aVal={String(flowA.critical ?? 0)} bVal={String(flowB.critical ?? 0)} aNum={flowA.critical ?? 0} bNum={flowB.critical ?? 0} higherIsBetter={false} />
                </tbody>
              </table>

              {/* Legend */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 text-[10px] text-slate-400">
                <span><span className="text-green-600 font-bold">↑</span> Improved</span>
                <span><span className="text-red-500 font-bold">↓</span> Declined</span>
                <span><span className="text-slate-400">→</span> No change</span>
                <span className="text-green-700 font-bold ml-2">Green value = better result</span>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
