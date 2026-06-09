// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// /forecast — Delivery forecasting: velocity trend, burn-up, and milestone estimates.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';

// ── Forecast engine ────────────────────────────────────────────────────────────

type ForecastStatus = 'on_track' | 'at_risk' | 'off_track' | 'complete' | 'insufficient_data';

interface SprintPoint { sprint: string; done: number; total: number; cumDone: number; }
interface ForecastResult {
  status:              ForecastStatus;
  totalIssues:         number;
  doneIssues:          number;
  remainingIssues:     number;
  completionPct:       number;
  avgThroughput:       number;   // items/sprint
  sprintsRemaining:    number;
  weeksRemaining:      number;
  confidence:          'high' | 'medium' | 'low';
  adjustments:         string[];
  sprintPoints:        SprintPoint[];
  blockedCount:        number;
  criticalCount:       number;
}

function computeForecast(metrics: DashboardMetrics): ForecastResult {
  const flow   = (metrics.flow?.items ?? []) as any[];
  const sprints = (metrics.sprint?.sprints ?? []) as any[];

  const totalIssues    = flow.length;
  const doneIssues     = flow.filter((i: any) => /^done|complete|closed|resolved/i.test(i.status ?? '')).length;
  const remainingIssues = Math.max(0, totalIssues - doneIssues);
  const blockedCount   = flow.filter((i: any) => i.blocked || /block/i.test(i.status ?? '') || (i.labels ?? '').includes('blocked')).length;
  const criticalCount  = flow.filter((i: any) => /critical|highest/i.test(i.priority ?? '')).length;
  const completionPct  = totalIssues > 0 ? Math.round(doneIssues / totalIssues * 100) : 0;

  // Sprint-level throughput
  const validSprints   = sprints.filter((s: any) => s.completedCount > 0);
  const avgThroughput  = validSprints.length > 0
    ? validSprints.reduce((s: number, x: any) => s + x.completedCount, 0) / validSprints.length
    : 0;

  // Sprint burn-up points
  let cum = 0;
  const sprintPoints: SprintPoint[] = sprints.slice(-12).map((s: any) => {
    cum += s.completedCount ?? 0;
    return { sprint: s.sprint ?? s.name ?? '?', done: s.completedCount ?? 0, total: totalIssues, cumDone: cum };
  });

  if (totalIssues === 0 || avgThroughput === 0) {
    return { status: 'insufficient_data', totalIssues, doneIssues, remainingIssues, completionPct, avgThroughput: 0, sprintsRemaining: 0, weeksRemaining: 0, confidence: 'low', adjustments: [], sprintPoints, blockedCount, criticalCount };
  }

  if (remainingIssues === 0) {
    return { status: 'complete', totalIssues, doneIssues, remainingIssues: 0, completionPct: 100, avgThroughput, sprintsRemaining: 0, weeksRemaining: 0, confidence: 'high', adjustments: [], sprintPoints, blockedCount, criticalCount };
  }

  const sprintsRemaining = remainingIssues / avgThroughput;
  const weeksRemaining   = Math.ceil(sprintsRemaining * 2);

  // Velocity trend (improving / stable / declining)
  let velocityTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (validSprints.length >= 3) {
    const recent = validSprints.slice(-3).map((s: any) => s.completedCount);
    const older  = validSprints.slice(0, -3).map((s: any) => s.completedCount);
    const recentAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const olderAvg  = older.length > 0 ? older.reduce((a: number, b: number) => a + b, 0) / older.length : recentAvg;
    velocityTrend   = recentAvg > olderAvg * 1.1 ? 'improving' : recentAvg < olderAvg * 0.9 ? 'declining' : 'stable';
  }

  const confidence: ForecastResult['confidence'] =
    validSprints.length >= 4 && velocityTrend !== 'declining' && blockedCount === 0 ? 'high' :
    validSprints.length >= 2 && blockedCount < 3 ? 'medium' : 'low';

  const status: ForecastStatus =
    sprintsRemaining <= 1 ? 'on_track' :
    sprintsRemaining <= 3 ? 'on_track' :
    criticalCount > 2 || blockedCount > 3 ? 'off_track' : 'at_risk';

  const adjustments: string[] = [];
  if (blockedCount > 0)    adjustments.push(`Unblock ${blockedCount} blocked item${blockedCount > 1 ? 's' : ''} to recover ${Math.ceil(blockedCount * 0.8)} issues.`);
  if (criticalCount > 0)   adjustments.push(`Address ${criticalCount} critical item${criticalCount > 1 ? 's' : ''} first — they affect confidence.`);
  if (velocityTrend === 'declining') adjustments.push('Throughput is declining. Reduce WIP and improve sprint planning.');
  if (remainingIssues > avgThroughput * 10) adjustments.push('Consider descoping low-priority items to hit nearer-term milestones.');
  if (adjustments.length === 0) adjustments.push('Velocity is stable. Maintain current pace to deliver on forecast.');

  return { status, totalIssues, doneIssues, remainingIssues, completionPct, avgThroughput: parseFloat(avgThroughput.toFixed(1)), sprintsRemaining: parseFloat(sprintsRemaining.toFixed(1)), weeksRemaining, confidence, adjustments, sprintPoints, blockedCount, criticalCount };
}

// ── Components ─────────────────────────────────────────────────────────────────

const STATUS_META = {
  on_track:         { label: 'On Track',         color: '#22c55e', bg: 'bg-green-50  border-green-200  text-green-700',  icon: '✅' },
  at_risk:          { label: 'At Risk',           color: '#f59e0b', bg: 'bg-amber-50  border-amber-200  text-amber-700',  icon: '⚠️' },
  off_track:        { label: 'Off Track',         color: '#ef4444', bg: 'bg-red-50    border-red-200    text-red-700',    icon: '❌' },
  complete:         { label: 'Complete',          color: '#2563eb', bg: 'bg-blue-50   border-blue-200   text-blue-700',   icon: '🎉' },
  insufficient_data:{ label: 'Insufficient Data', color: '#94a3b8', bg: 'bg-slate-50  border-slate-200  text-slate-600',  icon: 'ℹ️' },
};

const CONF_META = {
  high:   'text-green-700 bg-green-50  border-green-200',
  medium: 'text-amber-700 bg-amber-50  border-amber-200',
  low:    'text-slate-600 bg-slate-50  border-slate-200',
};

function BurnUpChart({ points, total }: { points: SprintPoint[]; total: number }) {
  if (points.length < 2) return <p className="text-xs text-slate-400 text-center py-6">Not enough sprint data for burn-up chart (need ≥ 2 sprints).</p>;
  const maxVal  = Math.max(total, ...points.map(p => p.cumDone));
  const w = 480; const h = 140; const pad = { t: 10, r: 16, b: 28, l: 36 };
  const xScale = (i: number) => pad.l + (i / (points.length - 1)) * (w - pad.l - pad.r);
  const yScale = (v: number) => h - pad.b - (v / maxVal) * (h - pad.t - pad.b);

  const totalPath = `M ${xScale(0)},${yScale(total)} L ${xScale(points.length - 1)},${yScale(total)}`;
  const burnPath  = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(p.cumDone)}`).join(' ');

  // Forecast line from last point
  const last = points[points.length - 1];
  const throughputPerPoint = last.cumDone / Math.max(points.length, 1);
  const sprintsLeft = throughputPerPoint > 0 ? (total - last.cumDone) / throughputPerPoint : 0;
  const forecastEnd = points.length - 1 + sprintsLeft;
  const forecastPath = `M ${xScale(points.length - 1)},${yScale(last.cumDone)} L ${Math.min(w - pad.r, xScale(forecastEnd))},${yScale(total)}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 160 }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(v => (
        <g key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={yScale(maxVal * v)} y2={yScale(maxVal * v)} stroke="#f1f5f9" strokeWidth="1" />
          <text x={pad.l - 4} y={yScale(maxVal * v) + 4} fontSize="8" fill="#94a3b8" textAnchor="end">{Math.round(maxVal * v)}</text>
        </g>
      ))}
      {/* Sprint labels */}
      {points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 4) === 0).map((p, _, arr) => {
        const idx = points.indexOf(p);
        return <text key={idx} x={xScale(idx)} y={h - 6} fontSize="7" fill="#94a3b8" textAnchor="middle">{p.sprint.replace(/sprint\s*/i, 'S')}</text>;
      })}
      {/* Target line */}
      <path d={totalPath} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 2" fill="none" />
      {/* Forecast line */}
      {sprintsLeft > 0 && <path d={forecastPath} stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="5 3" fill="none" />}
      {/* Burn-up line */}
      <path d={burnPath} stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Data points */}
      {points.map((p, i) => <circle key={i} cx={xScale(i)} cy={yScale(p.cumDone)} r="3" fill="#2563eb" />)}
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const router  = useRouter();
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const r = await loadMetricsWithSource();
      const m = r.metrics as DashboardMetrics | null;
      if (!m) { router.replace('/'); return; }
      setResult(computeForecast(m));
      setLoading(false);
    }
    load().catch(() => router.replace('/'));
  }, [router]);

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Computing forecast…</div></AppShell>;
  if (!result)  return null;

  const meta = STATUS_META[result.status];

  return (
    <AppShell showNav>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 text-xs font-bold text-indigo-700 mb-3">
            🔮 Delivery
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Forecast</h1>
          <p className="text-sm text-slate-500">
            Velocity-based delivery forecast — based on your uploaded Jira sprint data.
          </p>
        </div>

        {/* Status banner */}
        <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 mb-5 ${meta.bg}`}>
          <span className="text-2xl">{meta.icon}</span>
          <div className="flex-1">
            <p className="font-black text-base">{meta.label}</p>
            {result.status === 'insufficient_data'
              ? <p className="text-sm mt-0.5 opacity-75">Forecast confidence is low — upload more sprints for accurate projections.</p>
              : <p className="text-sm mt-0.5 opacity-75">~{result.weeksRemaining} weeks to complete {result.remainingIssues} remaining items at {result.avgThroughput} items/sprint.</p>
            }
          </div>
          <span className={`text-xs font-bold border rounded-full px-3 py-1 ${CONF_META[result.confidence]}`}>
            {result.confidence} confidence
          </span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Issues',   value: result.totalIssues,              icon: '📋' },
            { label: 'Done',           value: `${result.doneIssues} (${result.completionPct}%)`, icon: '✅' },
            { label: 'Remaining',      value: result.remainingIssues,          icon: '⏳' },
            { label: 'Avg Throughput', value: result.avgThroughput > 0 ? `${result.avgThroughput}/sprint` : '—', icon: '⚡' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-lg mb-1">{c.icon}</p>
              <p className="text-base font-black text-slate-900">{c.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Burn-up chart */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900">Burn-up Chart</h2>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-blue-500 rounded" /> Actual</span>
              <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-blue-200 rounded border-dashed border border-blue-200" /> Forecast</span>
              <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-slate-200 rounded" /> Target</span>
            </div>
          </div>
          <BurnUpChart points={result.sprintPoints} total={result.totalIssues} />
        </div>

        {/* Risk signals */}
        {(result.blockedCount > 0 || result.criticalCount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <h2 className="text-sm font-black text-amber-800 mb-2">⚠️ Risk Signals</h2>
            <div className="flex gap-4">
              {result.blockedCount > 0 && <p className="text-xs text-amber-700"><strong>{result.blockedCount}</strong> blocked item{result.blockedCount > 1 ? 's' : ''}</p>}
              {result.criticalCount > 0 && <p className="text-xs text-amber-700"><strong>{result.criticalCount}</strong> critical priority item{result.criticalCount > 1 ? 's' : ''}</p>}
            </div>
          </div>
        )}

        {/* Next quarter plan */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-5">
          <h2 className="text-sm font-black text-slate-900 mb-3">📅 Next Quarter Plan</h2>
          {result.avgThroughput > 0 ? (
            <div className="space-y-2 text-sm text-slate-600">
              <p>At <strong>{result.avgThroughput} items/sprint</strong> across 6 sprints, you can complete approximately <strong>{Math.round(result.avgThroughput * 6)} items</strong> next quarter.</p>
              {result.remainingIssues <= result.avgThroughput * 6
                ? <p className="text-green-700 font-semibold">✅ Current backlog is achievable within one quarter at this velocity.</p>
                : <p className="text-amber-700 font-semibold">⚠️ Backlog exceeds one quarter of capacity — consider descoping or splitting into milestones.</p>
              }
            </div>
          ) : (
            <p className="text-sm text-slate-400">Upload Jira data with sprint history to see quarterly planning.</p>
          )}
        </div>

        {/* Adjustment recommendations */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-black text-slate-900 mb-3">💡 Recommendations</h2>
          <ul className="space-y-2">
            {result.adjustments.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                {a}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Forecast model: linear velocity extrapolation based on completed items per sprint. 2-week sprint assumption.
            Low data quality reduces confidence. This is an estimate, not a guarantee.
          </p>
        </div>

      </div>
    </AppShell>
  );
}
