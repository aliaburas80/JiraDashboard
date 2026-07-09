// @ts-nocheck
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { DashboardMetrics } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton,
  PageHeader, MiniKpiCard, SectionCard, PageLoading, shellStyles, barCssVars,
} from '@/components/dashboard/DashboardPageShell';
import styles from './page.module.scss';

// EXCEPTION (CLAUDE.md Rule 1): kpi colors are data-driven; passed as CSS custom properties.
const KPI_TOKENS = [
  { label: 'Completion',     color: 'var(--color-health-excellent-text)', bg: 'var(--color-success-soft)',    border: 'var(--color-success-border)'  },
  { label: 'Health Alerts',  color: 'var(--color-danger-strong)',          bg: 'var(--color-danger-soft)',     border: 'var(--color-danger-border)'   },
  { label: 'Active Work',    color: 'var(--color-warning)',                bg: 'var(--color-warning-soft)',    border: 'var(--color-warning-border)'  },
  { label: 'Lead Time',      color: '#7c3aed',                             bg: 'rgb(124 58 237 / 10%)',        border: 'rgb(124 58 237 / 25%)'        },
  { label: 'Cycle Time',     color: 'var(--color-primary)',                bg: 'var(--color-primary-soft)',    border: 'var(--color-primary-border)'  },
  { label: 'Story Points',   color: '#0891b2',                             bg: 'rgb(8 145 178 / 10%)',         border: 'rgb(8 145 178 / 25%)'         },
];

export default function KeyMetricsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'sprint' | 'quarter'>('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadMetricsWithSource();
        if (cancelled) return;
        const data = result.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        setMetrics(data);
      } catch { if (!cancelled) router.replace('/'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  const exportMetrics = () => {
    if (!metrics) return;
    const flow = metrics.flow;
    const sp = metrics.storyPoints;
    const rows = [
      ['Metric', 'Value', 'Detail'],
      ['Completion Rate', `${metrics.completionRate}%`, `${metrics.doneIssues} of ${metrics.totalIssues} done`],
      ['Health Alerts', (flow.critical + flow.warning), `${flow.critical} critical, ${flow.warning} warning`],
      ['Lead Time', `${flow.averageLeadTimeDays}d`, `${flow.leadTimeSampleSize} completed items`],
      ['Cycle Time', `${flow.averageCycleTimeDays}d`, `${flow.cycleTimeSampleSize} items w/ start dates`],
      ['Active Issues', metrics.activeIssues, 'In progress, review, QA, UAT'],
      ['Story Points Total', sp.totalStoryPoints, `${sp.pointCompletionRate}% complete`],
      ['Story Points Done', sp.completedStoryPoints, ''],
    ];
    const csv = buildSafeCsv(rows, { alwaysQuote: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'key-metrics.csv'; a.click();
  };

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const flow = metrics.flow;
  const sp = metrics.storyPoints;
  const prediction = metrics.prediction;
  const targetCompletion = (metrics as any).sprintTargetCompletion || '82%';

  const kpiValues = [
    `${metrics.completionRate || 0}%`,
    String((flow.critical || 0) + (flow.warning || 0)),
    String(metrics.activeIssues || 0),
    `${flow.averageLeadTimeDays || 0}d`,
    `${flow.averageCycleTimeDays || 0}d`,
    String(sp.totalStoryPoints || 0),
  ];

  return (
    <>
      <StickyToolbar>
        <FilterChip label="All"     active={period === 'all'}     onClick={() => setPeriod('all')} />
        <FilterChip label="Sprint"  active={period === 'sprint'}  onClick={() => setPeriod('sprint')} />
        <FilterChip label="Quarter" active={period === 'quarter'} onClick={() => setPeriod('quarter')} />
        <FilterChip label="Clear"   active={false}                onClick={() => setPeriod('all')} />
        <ToolbarSpacer />
        <ToolbarButton label="Export" onClick={exportMetrics} />
      </StickyToolbar>

      <PageHeader
        id="tour-header-key-metrics"
        title="Key Metrics"
        badge="6 KPI cards"
        subtitle="Delivery KPIs, lead time, cycle time, throughput, and predictability."
      />

      <div className={shellStyles.pageBody}>

        {/* ── Target vs Actual ── */}
        <div className={shellStyles.metaBar}>
          <span className={shellStyles.metaBarLabel}>Target vs Actual</span>
          <span className={shellStyles.metaBarValue}>{targetCompletion} target / {metrics.completionRate || 0}% actual</span>
          {prediction?.predictedDate && (
            <span className={shellStyles.metaBarRight}>Est. {prediction.predictedDate}</span>
          )}
        </div>

        {/* ── 6 KPI cards ── */}
        <div className={shellStyles.kpiGrid3}>
          {KPI_TOKENS.map((tok, i) => (
            <MiniKpiCard
              key={tok.label}
              index={i}
              label={tok.label}
              value={kpiValues[i]}
              color={tok.color}
              bg={tok.bg}
              border={tok.border}
            />
          ))}
        </div>

        {/* ── Story points breakdown ── */}
        <SectionCard title="Story Points Breakdown">
          <div className={styles.snapshotGrid3}>
            {[
              { label: 'Total Points',    value: sp.totalStoryPoints || 0 },
              { label: 'Completed',       value: sp.completedStoryPoints || 0 },
              { label: 'Completion Rate', value: `${sp.pointCompletionRate || 0}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className={styles.snapshotLabel}>{label}</p>
                <p className={styles.snapshotValue}>{value}</p>
              </div>
            ))}
          </div>
          {/* --bar-color / --bar-width are data-driven; consumed by .progressFill in shellStyles */}
          <div className={styles.progressTrack}>
            <div
              className={shellStyles.progressFill}
              style={barCssVars('var(--color-health-excellent-arc)', sp.pointCompletionRate || 0, 150)}
            />
          </div>
        </SectionCard>

        {/* ── Flow metrics ── */}
        <SectionCard title="Flow Metrics">
          <div className={styles.statGrid2}>
            {[
              { label: 'Average Lead Time',  value: `${flow.averageLeadTimeDays || 0}d`,  sub: `Sample: ${flow.leadTimeSampleSize || 0} items` },
              { label: 'Average Cycle Time', value: `${flow.averageCycleTimeDays || 0}d`, sub: `Sample: ${flow.cycleTimeSampleSize || 0} items` },
              { label: 'Critical Items',     value: flow.critical || 0,                   sub: 'Immediate action required' },
              { label: 'Warning Items',      value: flow.warning || 0,                    sub: 'Monitor closely' },
            ].map(({ label, value, sub }) => (
              <div key={label} className={styles.statCard}>
                <p className={styles.statLabel}>{label}</p>
                <p className={styles.statValue}>{value}</p>
                <p className={styles.statSub}>{sub}</p>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </>
  );
}
