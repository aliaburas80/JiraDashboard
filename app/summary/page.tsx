// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import KpiCard from '@/components/ui/KpiCard';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';
import { exportToExcel, exportToHtml, exportExecutivePdf } from '@/lib/exportUtils';
import { getHealthBand, HEALTH_COLORS, type HealthBand } from '@/lib/utils';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import WhatChangedPanel from '@/components/dashboard/WhatChangedPanel';
import dynamic from 'next/dynamic';
const ProductTour = dynamic(() => import('@/components/tour/ProductTour'), { ssr: false });

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

// ── Action toolbar helpers ────────────────────────────────────────────────────

function CtaBtn({ label, color, icon, onClick }: { label: string; color: string; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 9999, border: 'none',
        cursor: 'pointer', background: 'transparent',
        fontSize: 13, fontWeight: 700, color: '#334155',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
        transition: 'background 150ms ease, color 150ms ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}14`; (e.currentTarget as HTMLButtonElement).style.color = color; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#334155'; }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 15, height: 15, fill: color, flexShrink: 0 }}>
        <path d={icon} />
      </svg>
      {label}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" style={{ width: 1, height: 22, background: '#e2e8f0', flexShrink: 0, margin: '0 3px' }} />;
}

export default function SummaryPage() {
  const router = useRouter();
  const [metrics, setMetrics]   = useState<DashboardMetrics | null>(null);
  const [loading, setLoading]   = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
      const result = await loadMetricsWithSource();
      if (cancelled) return;
      const data = result.metrics as DashboardMetrics | null;
      if (!data) { router.replace('/'); return; }
      setMetrics(data);
    } catch {
      router.replace('/');
    } finally {
      if (!cancelled) setLoading(false);
    }
    }
    load();
    // Check login state for onboarding
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(me => {
      if (me?.userId) setIsLoggedIn(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return <AppShell showNav><LoadingState message="Loading summary…" /></AppShell>;
  if (!metrics) return null;

  const flow      = (metrics.flow        ?? {}) as any;
  const sp        = (metrics.storyPoints ?? {}) as any;
  const items     = (flow.items          ?? []) as any[];
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
      {/* ── Onboarding checklist — shown to first-time users ── */}
      <OnboardingChecklist isLoggedIn={isLoggedIn} />

      {/* ── What changed since last upload ── */}
      <WhatChangedPanel />

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

      {/* ── CTA action toolbar ── */}
      <div className="flex justify-center pt-2 pb-6">
        <div
          className="overflow-x-auto"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 9999,
            padding: '5px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            gap: 2,
          }}
        >
          {/* ── Group 1: Utility ── */}
          {[
            { label: 'Upload',    color: '#64748b', icon: 'M11 3h2v10.2l3.6-3.6L18 11l-6 6-6-6 1.4-1.4 3.6 3.6V3ZM5 19h14v2H5v-2Z', onClick: () => router.push('/') },
            { label: 'Take tour', color: '#64748b', icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z', onClick: () => { router.push('/dashboard'); setTimeout(() => window.dispatchEvent(new CustomEvent('dc:start-tour')), 600); } },
          ].map(btn => (
            <CtaBtn key={btn.label} {...btn} />
          ))}

          <Divider />

          {/* ── Group 2: Export ── */}
          {[
            { label: 'Excel',     color: '#059669', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 2 3 3h-3V4ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z', onClick: async () => { if (metrics) await exportToExcel(metrics); } },
            { label: 'Exec PDF',  color: '#7c3aed', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm4 18H6V4h7v5h5v11ZM8 15h8v1.5H8V15Zm0-3h8v1.5H8V12Zm0-3h5v1.5H8V9Z', onClick: async () => { if (metrics) await exportExecutivePdf(metrics); } },
            { label: 'HTML',      color: '#10b981', icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z', onClick: () => metrics && exportToHtml(metrics) },
          ].map(btn => (
            <CtaBtn key={btn.label} {...btn} />
          ))}

          <Divider />

          {/* ── Group 3: Navigate ── */}
          {[
            { label: 'Charts',      color: '#2563eb', icon: 'M4 20h16v2H2V2h2v18Zm4-2V8h3v10H8Zm5 0V4h3v14h-3Zm5 0v-6h3v6h-3Z', onClick: () => router.push('/charts') },
            { label: 'Full Report', color: '#0f172a', icon: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z', onClick: () => router.push('/dashboard') },
            { label: 'Customer',    color: '#0d9488', icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4Z', onClick: () => router.push('/customer') },
          ].map(btn => (
            <CtaBtn key={btn.label} {...btn} />
          ))}
        </div>
      </div>
      {/* Tour auto-starts on first visit; fires when user navigates to dashboard */}
      <ProductTour />
    </AppShell>
  );
}
