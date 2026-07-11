// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, ToolbarSpacer,
  PageHeader, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const ACTIVE_STATUSES = ['in progress', 'code review', 'qa', 'testing', 'uat'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

export default function DeliveryCompositionPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

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

  const flowItems: FlowItem[] = useMemo(() => {
    const raw = metrics?.flow?.items ?? [];
    const seen = new Set<string>();
    return raw.filter(i => { if (seen.has(i.key)) return false; seen.add(i.key); return true; });
  }, [metrics?.flow?.items]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const totalIssues = Math.max(metrics.totalIssues, 1);
  const storyPoints = metrics.storyPoints;

  const doneBucket   = flowItems.filter(i => DONE_STATUSES.includes(norm(i.status))).length;
  const critBucket   = flowItems.filter(i => !DONE_STATUSES.includes(norm(i.status)) && norm(i.health) === 'critical').length;
  const warnBucket   = flowItems.filter(i => !DONE_STATUSES.includes(norm(i.status)) && norm(i.health) === 'warning').length;
  const activeBucket = flowItems.filter(i => ACTIVE_STATUSES.includes(norm(i.status)) && !DONE_STATUSES.includes(norm(i.status)) && norm(i.health) !== 'critical' && norm(i.health) !== 'warning').length;
  const otherBucket  = Math.max(totalIssues - doneBucket - critBucket - warnBucket - activeBucket, 0);
  const orphanCount  = flowItems.filter(i => i.isOrphan).length;

  const segments = [
    { key: 'done',    label: 'Done',            value: doneBucket,   color: '#22C55E' },
    { key: 'active',  label: 'In Progress',     value: activeBucket, color: '#FF8A4C' },
    { key: 'warning', label: 'At Risk',          value: warnBucket,   color: '#F59E0B' },
    { key: 'critical',label: 'Critical',         value: critBucket,   color: '#F87171' },
    { key: 'other',   label: 'Backlog / Other',  value: otherBucket,  color: '#CBD5E1' },
  ].filter(s => s.value > 0);

  const segTotal = Math.max(segments.reduce((a, s) => a + s.value, 0), 1);
  let cursor = 0;
  const donutBg = `conic-gradient(${segments.map(s => {
    const st = cursor;
    cursor += (s.value / segTotal) * 100;
    return `${s.color} ${st}% ${cursor}%`;
  }).join(', ')})`;

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        id="tour-header-delivery-composition"
        title="Delivery Composition"
        badge={`${metrics.completionRate || 0}% complete`}
        subtitle="How the current delivery period breaks down by status and health."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Donut + breakdown ── */}
        <div id="tour-section-delivery-composition-1" style={{ display: 'flex', alignItems: 'center', gap: 40, padding: '24px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 20 }}>
          {/* Donut */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 180, height: 180, borderRadius: '50%', background: donutBg, animation: 'donutReveal 700ms ease-out both' }} role="img" aria-label="Delivery composition ring" />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(248,250,252,0.95) 52%, transparent 52%)',
            }}>
              <span style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>{metrics.completionRate || 0}%</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>complete</span>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>{metrics.doneIssues || 0} of {totalIssues}</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {segments.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#64748B', flex: 1 }}>{s.label}</span>
                  <strong style={{ fontSize: 13, color: '#0F172A' }}>{s.value}</strong>
                  <span style={{ fontSize: 10, color: '#94A3B8', width: 32, textAlign: 'right' }}>{Math.round((s.value / segTotal) * 100)}%</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748B' }}>
              <span>Total <strong style={{ color: '#0F172A' }}>{totalIssues.toLocaleString()}</strong> issues</span>
              {orphanCount > 0 && <span>Orphans <strong style={{ color: '#0F172A' }}>{orphanCount}</strong></span>}
              {storyPoints.totalStoryPoints > 0 && <span>Points <strong style={{ color: '#0F172A' }}>{storyPoints.completedStoryPoints || 0} / {storyPoints.totalStoryPoints}</strong></span>}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
