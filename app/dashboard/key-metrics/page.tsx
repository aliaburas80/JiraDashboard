// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton, LayoutControl,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

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
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
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

  const kpiCards = [
    { label: 'Completion', value: `${metrics.completionRate || 0}%`, detail: `${metrics.doneIssues || 0} of ${metrics.totalIssues || 0} done`, color: '#059669', bg: '#F0FDF4', border: '#BBF7D0', good: (metrics.completionRate || 0) >= 70 },
    { label: 'Health Alerts', value: String((flow.critical || 0) + (flow.warning || 0)), detail: `${flow.critical || 0} critical · ${flow.warning || 0} warning`, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', good: false },
    { label: 'Active Work', value: String(metrics.activeIssues || 0), detail: 'In progress, review, QA, UAT', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', good: true },
    { label: 'Lead Time', value: `${flow.averageLeadTimeDays || 0}d`, detail: `${flow.leadTimeSampleSize || 0} completed items`, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', good: (flow.averageLeadTimeDays || 0) <= 14 },
    { label: 'Cycle Time', value: `${flow.averageCycleTimeDays || 0}d`, detail: `${flow.cycleTimeSampleSize || 0} items w/ start dates`, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', good: (flow.averageCycleTimeDays || 0) <= 10 },
    { label: 'Story Points', value: String(sp.totalStoryPoints || 0), detail: `${sp.pointCompletionRate || 0}% complete`, color: '#0891B2', bg: '#F0F9FF', border: '#BAE6FD', good: true },
  ];

  return (
    <>
      <StickyToolbar>
        <FilterChip label="All" active={period === 'all'} onClick={() => setPeriod('all')} />
        <FilterChip label="Sprint" active={period === 'sprint'} onClick={() => setPeriod('sprint')} />
        <FilterChip label="Quarter" active={period === 'quarter'} onClick={() => setPeriod('quarter')} />
        <FilterChip label="Clear" active={false} onClick={() => setPeriod('all')} />
        <ToolbarSpacer />
        <ToolbarButton label="Export" onClick={exportMetrics} />
        <LayoutControl />
      </StickyToolbar>

      <PageHeader
        title="Key Metrics"
        badge="6 KPI cards"
        subtitle="Delivery KPIs, lead time, cycle time, throughput, and predictability."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Target vs Actual ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.06em' }}>Target vs Actual</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{targetCompletion} target / {metrics.completionRate || 0}% actual</div>
          {prediction?.predictedDate && (
            <div style={{ marginLeft: 'auto', fontSize: 12, color: '#2563EB', fontWeight: 600 }}>Est. {prediction.predictedDate}</div>
          )}
        </div>

        {/* ── 6 KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {kpiCards.map(({ label, value, detail, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '18px 20px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color, margin: '0 0 4px', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{detail}</p>
            </div>
          ))}
        </div>

        {/* ── Story points breakdown ── */}
        <SectionCard title="Story Points Breakdown">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Points', value: sp.totalStoryPoints || 0 },
              { label: 'Completed', value: sp.completedStoryPoints || 0 },
              { label: 'Completion Rate', value: `${sp.pointCompletionRate || 0}%` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: '#059669', width: `${Math.min(100, sp.pointCompletionRate || 0)}%`, transition: 'width 600ms' }} />
            </div>
          </div>
        </SectionCard>

        {/* ── Flow metrics ── */}
        <SectionCard title="Flow Metrics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { label: 'Average Lead Time', value: `${flow.averageLeadTimeDays || 0}d`, sub: `Sample: ${flow.leadTimeSampleSize || 0} items` },
              { label: 'Average Cycle Time', value: `${flow.averageCycleTimeDays || 0}d`, sub: `Sample: ${flow.cycleTimeSampleSize || 0} items` },
              { label: 'Critical Items', value: flow.critical || 0, sub: 'Immediate action required' },
              { label: 'Warning Items', value: flow.warning || 0, sub: 'Monitor closely' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ padding: '12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', margin: '0 0 2px' }}>{value}</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </>
  );
}
