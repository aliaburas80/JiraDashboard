// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, ToolbarSpacer, ToolbarButton, LayoutControl,
  PageHeader, SectionCard, PageLoading,
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

  const typeDist = useMemo(() => {
    const map = new Map<string, number>();
    flowItems.forEach(i => { const t = String(i.type ?? 'Unknown'); map.set(t, (map.get(t) ?? 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [flowItems]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const totalIssues = Math.max(metrics.totalIssues, 1);
  const flow = metrics.flow;
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

  const typeMax = Math.max(...typeDist.map(r => r.count), 1);
  const TYPE_COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />
        <LayoutControl />
      </StickyToolbar>

      <PageHeader
        title="Delivery Composition"
        badge={`${metrics.completionRate || 0}% complete`}
        subtitle="Work breakdown by status, type, health, and epic contribution."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Donut + breakdown ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, padding: '24px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 20 }}>
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

        {/* ── Type breakdown ── */}
        {typeDist.length > 0 && (
          <SectionCard title="Composition by Type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {typeDist.map((r, i) => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 120, fontSize: 12, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.name}>{r.name}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: TYPE_COLORS[i % TYPE_COLORS.length], width: `${(r.count / typeMax) * 100}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 60}ms` }} />
                  </div>
                  <strong style={{ fontFamily: 'monospace', fontSize: 11, color: TYPE_COLORS[i % TYPE_COLORS.length], width: 36, textAlign: 'right', flexShrink: 0 }}>{r.count}</strong>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Story points composition ── */}
        {storyPoints.totalStoryPoints > 0 && (
          <SectionCard title="Story Points Composition">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 12 }}>
              {[
                { label: 'Total', value: storyPoints.totalStoryPoints, color: '#2563EB' },
                { label: 'Completed', value: storyPoints.completedStoryPoints || 0, color: '#059669' },
                { label: 'Remaining', value: (storyPoints.totalStoryPoints - (storyPoints.completedStoryPoints || 0)), color: '#D97706' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, margin: 0 }}>{value.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 4, background: '#059669', width: `${Math.min(100, storyPoints.pointCompletionRate || 0)}%`, animation: 'barFill 900ms ease-out both', transformOrigin: 'left center', animationDelay: '200ms' }} />
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}
