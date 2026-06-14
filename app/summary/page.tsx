// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import {
  PageLoading, SectionCard, MiniKpiCard,
} from '@/components/dashboard/DashboardPageShell';
import type { DashboardMetrics } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';
import { exportToExcel, exportToHtml, exportExecutivePdf } from '@/lib/exportUtils';
import { getHealthBand, HEALTH_COLORS, type HealthBand } from '@/lib/utils';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import WhatChangedPanel from '@/components/dashboard/WhatChangedPanel';
import dynamic from 'next/dynamic';
import styles from './page.module.scss';
const ProductTour = dynamic(() => import('@/components/tour/ProductTour'), { ssr: false });

const DONE_STATUSES = new Set(['done', 'closed', 'resolved']);
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

const BAND_LABELS: Record<HealthBand, string> = {
  excellent: 'Excellent', good: 'Good', moderate: 'Moderate',
  'at-risk': 'At Risk',  critical: 'Critical',
};

// Map health band → dashboard token values (CSS custom props consumed by MiniKpiCard / health banner)
const BAND_TOKENS: Record<HealthBand, { bg: string; border: string; color: string; ring: string }> = {
  excellent: { bg: 'var(--color-success-soft)',            border: 'var(--color-success-border)',  color: 'var(--color-success)',       ring: '#059669' },
  good:      { bg: 'rgb(20 184 166 / 10%)',                border: 'rgb(20 184 166 / 25%)',         color: '#0f766e',                    ring: '#0f766e' },
  moderate:  { bg: 'var(--color-warning-soft)',            border: 'var(--color-warning-border)',  color: 'var(--color-warning)',        ring: '#d97706' },
  'at-risk': { bg: 'rgb(234 88 12 / 10%)',                 border: 'rgb(234 88 12 / 25%)',          color: '#ea580c',                    ring: '#ea580c' },
  critical:  { bg: 'var(--color-danger-soft)',             border: 'var(--color-danger-border)',   color: 'var(--color-danger-strong)', ring: '#dc2626' },
};

// ── Action toolbar ────────────────────────────────────────────────────────────

function CtaBtn({ label, color, icon, onClick }: { label: string; color: string; icon: string; onClick: () => void }) {
  const colorClass =
    color === '#64748b' ? styles.actionButtonNeutral
      : color === '#059669' ? styles.actionButtonGreen
      : color === '#7c3aed' ? styles.actionButtonPurple
      : color === '#2563eb' ? styles.actionButtonBlue
      : color === '#0d9488' ? styles.actionButtonTeal
      : styles.actionButtonDark;

  return (
    <button type="button" onClick={onClick} className={`${styles.actionButton} ${colorClass}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.ctaIcon}><path d={icon} /></svg>
      {label}
    </button>
  );
}

function Divider() { return <span aria-hidden="true" className={styles.divider} />; }

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
      } catch { router.replace('/'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(me => {
      if (me?.userId) setIsLoggedIn(true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return <AppShell showNav><PageLoading /></AppShell>;
  if (!metrics) return null;

  const flow      = (metrics.flow        ?? {}) as any;
  const sp        = (metrics.storyPoints ?? {}) as any;
  const items     = (flow.items          ?? []) as any[];
  const riskItems = (flow.critical ?? 0) + (flow.warning ?? 0);
  const band      = getHealthBand(metrics.healthScore ?? 0);
  const tok       = BAND_TOKENS[band];

  const topBlockers = items.filter(i => i.health === 'critical' && norm(i.reason).includes('block')).slice(0, 3);
  const topOverdue  = items.filter(i => Number(i.ageDays) > 10 && !DONE_STATUSES.has(norm(i.status))).slice(0, 3);
  const orphanCount = items.filter(i => i.isOrphan).length;
  const hasAttention = topBlockers.length > 0 || topOverdue.length > 0 || orphanCount > 0;

  return (
    <AppShell showNav>
      <OnboardingChecklist isLoggedIn={isLoggedIn} />
      <WhatChangedPanel />

      {/* ── Health banner ────────────────────────────────────────────────────── */}
      <div
        className={styles.healthBanner}
        style={{ '--banner-bg': tok.bg, '--banner-border': tok.border } as React.CSSProperties}
        aria-label="Delivery health summary"
      >
        {/* Score circle */}
        <div
          className={styles.healthCircle}
          style={{ '--ring-color': tok.ring } as React.CSSProperties}
        >
          <span className={styles.healthScore} style={{ '--score-color': tok.color } as React.CSSProperties}>
            {metrics.healthScore ?? 0}
          </span>
          <span className={styles.healthScoreDenom}>/ 100</span>
        </div>

        {/* Summary text */}
        <div className={styles.healthMeta}>
          <span className={styles.healthBand}>{BAND_LABELS[band]}</span>
          <span className={styles.healthDetail}>
            {riskItems === 0
              ? 'Delivery is on track'
              : `${riskItems} item${riskItems !== 1 ? 's' : ''} need attention`}
            &nbsp;&middot;&nbsp;
            {metrics.completionRate ?? 0}% complete
            &nbsp;&middot;&nbsp;
            {metrics.doneIssues ?? 0} of {metrics.totalIssues ?? 0} issues done
          </span>
        </div>

        {/* Prediction chip */}
        {metrics.prediction && !metrics.prediction.complete && metrics.prediction.daysRemaining !== null && (
          <div className={styles.predictionChip}>
            <span className={styles.predictionDays}>~{metrics.prediction.daysRemaining}d</span>
            <span className={styles.predictionLabel}>
              Est. completion
              {metrics.prediction.predictedDate && <><br />{metrics.prediction.predictedDate}</>}
            </span>
          </div>
        )}
        {metrics.prediction?.complete && (
          <div className={`${styles.predictionChip} ${styles.predictionComplete}`}>
            <span className={styles.predictionDays}>100%</span>
            <span className={styles.predictionLabel}>All issues complete</span>
          </div>
        )}
      </div>

      {/* ── KPI cards ── */}
      <SectionCard title="Key Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniKpiCard index={0} label="Completion"    value={`${metrics.completionRate ?? 0}%`}        color="var(--color-success)"       bg="var(--color-success-soft)"  border="var(--color-success-border)"  />
          <MiniKpiCard index={1} label="Health Alerts" value={String(riskItems)}                         color="var(--color-danger-strong)"  bg="var(--color-danger-soft)"   border="var(--color-danger-border)"   />
          <MiniKpiCard index={2} label="Active Work"   value={String(metrics.activeIssues ?? 0)}         color="var(--color-warning)"        bg="var(--color-warning-soft)"  border="var(--color-warning-border)"  />
          <MiniKpiCard index={3} label="Lead Time"     value={`${flow.averageLeadTimeDays ?? 0}d`}       color="var(--color-primary)"        bg="var(--color-primary-soft)"  border="var(--color-primary-border)"  />
          <MiniKpiCard index={4} label="Cycle Time"    value={`${flow.averageCycleTimeDays ?? 0}d`}      color="#0f766e"                     bg="rgb(20 184 166 / 10%)"      border="rgb(20 184 166 / 25%)"        />
          <MiniKpiCard index={5} label="Story Points"  value={(sp.totalStoryPoints ?? 0) > 0 ? `${sp.pointCompletionRate ?? 0}%` : '—'}  color="#7c3aed" bg="rgb(124 58 237 / 10%)" border="rgb(124 58 237 / 25%)" />
        </div>
      </SectionCard>

      {/* ── Attention ── */}
      {hasAttention && (
        <SectionCard title="Attention Required">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topBlockers.length > 0 && (
              <div className={`${styles.attentionCard} ${styles.attentionHigh}`}>
                <div className={styles.attentionHeader}>
                  <span aria-hidden="true">🚫</span>
                  <span className={styles.attentionCount}>{topBlockers.length}</span>
                  <span className={styles.attentionLabel}>Blocker{topBlockers.length !== 1 ? 's' : ''}</span>
                </div>
                <p className={styles.attentionDetail}>
                  <span className={styles.attentionKey}>{topBlockers[0].key}</span>
                  {': '}{(topBlockers[0].summary || topBlockers[0].reason || '').slice(0, 55)}
                </p>
              </div>
            )}
            {topOverdue.length > 0 && (
              <div className={`${styles.attentionCard} ${styles.attentionMedium}`}>
                <div className={styles.attentionHeader}>
                  <span aria-hidden="true">⏰</span>
                  <span className={styles.attentionCount}>{topOverdue.length}</span>
                  <span className={styles.attentionLabel}>Overdue</span>
                </div>
                <p className={styles.attentionDetail}>
                  <span className={styles.attentionKey}>{topOverdue[0].key}</span>
                  {': open '}{Math.round(Number(topOverdue[0].ageDays) || 0)}{' days'}
                </p>
              </div>
            )}
            {orphanCount > 0 && (
              <div className={`${styles.attentionCard} ${styles.attentionNeutral}`}>
                <div className={styles.attentionHeader}>
                  <span aria-hidden="true">👻</span>
                  <span className={styles.attentionCount}>{orphanCount}</span>
                  <span className={styles.attentionLabel}>Orphan{orphanCount !== 1 ? 's' : ''}</span>
                </div>
                <p className={styles.attentionDetail}>Items without epic or parent</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Insights ── */}
      {(metrics.insights?.length ?? 0) > 0 && (
        <SectionCard title="Key Insights">
          <ul className="space-y-2.5">
            {metrics.insights.slice(0, 4).map((insight: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                {insight}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* ── CTA action toolbar ── */}
      <div className="flex justify-center pt-2 pb-6">
        <div className={styles.actionToolbar}>
          {[
            { label: 'Upload',    color: '#64748b', icon: 'M11 3h2v10.2l3.6-3.6L18 11l-6 6-6-6 1.4-1.4 3.6 3.6V3ZM5 19h14v2H5v-2Z', onClick: () => router.push('/') },
            { label: 'Take tour', color: '#64748b', icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z',   onClick: () => { router.push('/dashboard'); setTimeout(() => window.dispatchEvent(new CustomEvent('dc:start-tour')), 600); } },
          ].map(btn => <CtaBtn key={btn.label} {...btn} />)}
          <Divider />
          {[
            { label: 'Excel',    color: '#059669', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 2 3 3h-3V4ZM8 11h8v1.5H8V11Zm0 3h8v1.5H8V14Zm0 3h5v1.5H8V17Z', onClick: async () => { if (metrics) await exportToExcel(metrics); } },
            { label: 'Exec PDF', color: '#7c3aed', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm4 18H6V4h7v5h5v11ZM8 15h8v1.5H8V15Zm0-3h8v1.5H8V12Zm0-3h5v1.5H8V9Z',  onClick: async () => { if (metrics) await exportExecutivePdf(metrics); } },
            { label: 'HTML',     color: '#10b981', icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z', onClick: () => metrics && exportToHtml(metrics) },
          ].map(btn => <CtaBtn key={btn.label} {...btn} />)}
          <Divider />
          {[
            { label: 'Charts',      color: '#2563eb', icon: 'M4 20h16v2H2V2h2v18Zm4-2V8h3v10H8Zm5 0V4h3v14h-3Zm5 0v-6h3v6h-3Z',      onClick: () => router.push('/charts') },
            { label: 'Full Report', color: '#0f172a', icon: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',            onClick: () => router.push('/dashboard') },
            { label: 'Customer',    color: '#0d9488', icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4Z', onClick: () => router.push('/customer') },
          ].map(btn => <CtaBtn key={btn.label} {...btn} />)}
        </div>
      </div>

      <ProductTour />
    </AppShell>
  );
}
