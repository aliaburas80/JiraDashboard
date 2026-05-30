// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/ui/KpiCard';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics } from '@/types/metrics';
import { getHealthBand, HEALTH_COLORS, type HealthBand } from '@/lib/utils';

const DONE_STATUSES = new Set(['done', 'closed', 'resolved']);
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

const BAND_LABELS: Record<HealthBand, string> = {
  excellent: 'Excellent',
  good: 'Good',
  moderate: 'Moderate',
  'at-risk': 'At Risk',
  critical: 'Critical',
};

const BAND_BG: Record<HealthBand, string> = {
  excellent: 'bg-green-50  border-green-200',
  good:      'bg-teal-50   border-teal-200',
  moderate:  'bg-amber-50  border-amber-200',
  'at-risk': 'bg-orange-50 border-orange-200',
  critical:  'bg-red-50    border-red-200',
};

export default function SummaryPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dc_metrics');
      if (!raw) { router.replace('/'); return; }
      setMetrics(JSON.parse(raw) as DashboardMetrics);
    } catch {
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <AppShell showNav><LoadingState message="Loading summary…" /></AppShell>;
  if (!metrics) return null;

  const flow      = metrics.flow        ?? {};
  const sp        = metrics.storyPoints ?? {};
  const items     = flow.items          ?? [];
  const riskItems = (flow.critical ?? 0) + (flow.warning ?? 0);
  const band      = getHealthBand(metrics.healthScore ?? 0);
  const color     = HEALTH_COLORS[band];

  const topBlockers = items
    .filter(i => i.health === 'critical' && norm(i.reason).includes('block'))
    .slice(0, 3);

  const topOverdue = items
    .filter(i => Number(i.ageDays) > 10 && !DONE_STATUSES.has(norm(i.status)))
    .slice(0, 3);

  const orphanCount = items.filter(i => i.isOrphan).length;
  const hasAttention = topBlockers.length > 0 || topOverdue.length > 0 || orphanCount > 0;

  return (
    <AppShell showNav>
      {/* ── Health banner ── */}
      <div
        className={`flex flex-wrap items-center gap-5 rounded-2xl border px-6 py-5 mb-7 shadow-sm ${BAND_BG[band]}`}
        aria-label="Delivery health summary"
      >
        {/* Score circle */}
        <div
          className="relative flex shrink-0 items-center justify-center w-20 h-20 rounded-full border-4"
          style={{ borderColor: color }}
        >
          <div className="flex flex-col items-center leading-none">
            <span className="text-2xl font-black" style={{ color }}>{metrics.healthScore ?? 0}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        {/* Text block */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="text-lg font-black text-slate-900 leading-snug">
            {BAND_LABELS[band]}
            {' — '}
            {riskItems === 0
              ? 'Delivery is on track'
              : `${riskItems} item${riskItems !== 1 ? 's' : ''} need attention`}
          </span>
          <span className="text-sm text-slate-600">
            {metrics.completionRate ?? 0}% complete
            &nbsp;&middot;&nbsp;
            {metrics.doneIssues ?? 0} of {metrics.totalIssues ?? 0} issues done
          </span>
        </div>

        {/* Prediction chip */}
        {metrics.prediction && !metrics.prediction.complete && metrics.prediction.daysRemaining !== null && (
          <div className="flex flex-col items-center shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-2.5 min-w-[90px]">
            <span className="text-xl font-black text-slate-900">~{metrics.prediction.daysRemaining}d</span>
            <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight mt-0.5">
              Est. completion
              {metrics.prediction.predictedDate && (
                <><br />{metrics.prediction.predictedDate}</>
              )}
            </span>
          </div>
        )}
        {metrics.prediction?.complete && (
          <div className="flex flex-col items-center shrink-0 bg-green-50 rounded-xl border border-green-200 shadow-sm px-4 py-2.5 min-w-[90px]">
            <span className="text-xl font-black text-green-700">100%</span>
            <span className="text-[10px] font-semibold text-green-600 text-center leading-tight mt-0.5">All issues complete</span>
          </div>
        )}
      </div>

      {/* ── KPI cards ── */}
      <section className="mb-7" aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            label="Completion"
            value={`${metrics.completionRate ?? 0}%`}
            detail={`${metrics.doneIssues ?? 0} of ${metrics.totalIssues ?? 0} issues`}
            accent="#16a34a"
          />
          <KpiCard
            label="Health Alerts"
            value={riskItems}
            detail={`${flow.critical ?? 0} critical · ${flow.warning ?? 0} warning`}
            accent="#dc2626"
          />
          <KpiCard
            label="Active Work"
            value={metrics.activeIssues ?? 0}
            detail="In Progress, Code Review, QA, UAT"
            accent="#d97706"
          />
          <KpiCard
            label="Lead Time"
            value={`${flow.averageLeadTimeDays ?? 0}d`}
            detail={`${flow.leadTimeSampleSize ?? 0} completed items`}
            accent="#2563eb"
          />
          <KpiCard
            label="Cycle Time"
            value={`${flow.averageCycleTimeDays ?? 0}d`}
            detail={`${flow.cycleTimeSampleSize ?? 0} items with start dates`}
            accent="#0f766e"
          />
          {(sp.totalStoryPoints ?? 0) > 0 ? (
            <KpiCard
              label="Story Points"
              value={`${sp.pointCompletionRate ?? 0}%`}
              detail={`${sp.completedStoryPoints ?? 0} / ${sp.totalStoryPoints} pts`}
              accent="#7c3aed"
            />
          ) : (
            <KpiCard
              label="Story Points"
              value="—"
              detail="No story points in this export"
              accent="#94a3b8"
            />
          )}
        </div>
      </section>

      {/* ── Attention ── */}
      {hasAttention && (
        <section className="mb-7" aria-labelledby="attention-heading">
          <h2 id="attention-heading" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
            Attention Required
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {topBlockers.length > 0 && (
              <div className="flex flex-col gap-1.5 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-xl">🚫</span>
                  <span className="text-2xl font-black text-red-700">{topBlockers.length}</span>
                  <span className="text-sm font-bold text-red-800">
                    Blocker{topBlockers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-red-700 leading-snug truncate">
                  <span className="font-mono font-bold">{topBlockers[0].key}</span>
                  {': '}
                  {(topBlockers[0].summary || topBlockers[0].reason || '').slice(0, 55)}
                </p>
              </div>
            )}

            {topOverdue.length > 0 && (
              <div className="flex flex-col gap-1.5 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-xl">⏰</span>
                  <span className="text-2xl font-black text-amber-700">{topOverdue.length}</span>
                  <span className="text-sm font-bold text-amber-800">Overdue</span>
                </div>
                <p className="text-xs text-amber-700 leading-snug truncate">
                  <span className="font-mono font-bold">{topOverdue[0].key}</span>
                  {': open '}
                  {Math.round(Number(topOverdue[0].ageDays) || 0)}
                  {' days'}
                </p>
              </div>
            )}

            {orphanCount > 0 && (
              <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-xl">👻</span>
                  <span className="text-2xl font-black text-slate-700">{orphanCount}</span>
                  <span className="text-sm font-bold text-slate-700">
                    Orphan{orphanCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">Items without epic or parent</p>
              </div>
            )}

          </div>
        </section>
      )}

      {/* ── Insights ── */}
      {(metrics.insights?.length ?? 0) > 0 && (
        <section className="mb-7" aria-labelledby="insights-heading">
          <h2 id="insights-heading" className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
            Key Insights
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <ul className="space-y-2.5">
              {metrics.insights.slice(0, 4).map((insight: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── CTA buttons ── */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 pb-6">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
        >
          Upload New File
        </button>
        <button
          type="button"
          onClick={() => router.push('/charts')}
          className="px-5 py-2.5 rounded-lg border border-blue-600 bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
        >
          View Charts →
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 shadow-sm transition-colors"
        >
          View Full Report →
        </button>
      </div>
    </AppShell>
  );
}
