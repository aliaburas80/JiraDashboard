// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, LayoutControl,
  PageHeader, MiniKpiCard, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

export default function DeliverySummaryPage() {
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

  const smartActions = useMemo(() => {
    if (!metrics) return [];
    const acts: { type: string; icon: string; title: string; detail: string; suggestedOwner: string }[] = [];
    const orphans = flowItems.filter(i => i.isOrphan).length;
    const critBlockers = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('block'));
    if (critBlockers.length)
      acts.push({ type: 'critical', icon: '🚫', title: `Unblock ${critBlockers.length} critical item${critBlockers.length > 1 ? 's' : ''}`, detail: `${critBlockers[0].key}: ${(critBlockers[0].summary || (critBlockers[0].reason ?? '')).slice(0, 70)}`, suggestedOwner: 'Scrum Master / Delivery Manager' });
    const staleActive = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('in progress over 14'));
    if (staleActive.length)
      acts.push({ type: 'critical', icon: '⏳', title: `${staleActive.length} item${staleActive.length > 1 ? 's' : ''} stalled in progress`, detail: `${staleActive[0].key} has been active for ${Math.round((staleActive[0] as any).activeAgeDays || 0)} days`, suggestedOwner: 'Engineering Manager' });
    const capacity = ((metrics?.capacity || []) as any[]);
    const overloaded = capacity.filter((c: any) => c.loadShare > 35);
    if (overloaded.length && capacity.length > 2)
      acts.push({ type: 'warning', icon: '⚖️', title: 'Team capacity imbalance detected', detail: `${overloaded[0].assignee} carries ${overloaded[0].loadShare}% — consider redistributing`, suggestedOwner: 'Engineering Manager' });
    if (orphans > 0)
      acts.push({ type: 'info', icon: '👻', title: `Link ${orphans} orphan item${orphans > 1 ? 's' : ''} to epics`, detail: 'Items without epic reduce scope traceability and epic completion accuracy', suggestedOwner: 'Product Owner' });
    const epics = (metrics?.epics as any[]) ?? [];
    const critEpics = epics.filter((e: any) => (e.critical ?? 0) > 0);
    if (critEpics.length)
      acts.push({ type: 'warning', icon: '🚨', title: `${critEpics.length} epic${critEpics.length > 1 ? 's' : ''} in critical state`, detail: `${critEpics[0].epic || 'Top epic'}: ${critEpics[0].completion ?? 0}% complete — needs attention`, suggestedOwner: 'Engineering Manager' });
    return acts.slice(0, 5);
  }, [flowItems, metrics]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const flow = metrics.flow;
  const prediction = metrics.prediction;
  const estimatedDone = prediction?.complete
    ? 'Done ✅'
    : (prediction?.predictedDate ?? (prediction?.daysRemaining != null ? `~${prediction.daysRemaining}d` : 'N/A'));
  const topBlockers = flowItems.filter(i => norm(i.reason).includes('block')).slice(0, 5);
  const overdueItems = flowItems.filter(i => Number(i.ageDays) > 10 && !DONE_STATUSES.includes(norm(i.status))).slice(0, 5);
  const orphanCount = flowItems.filter(i => i.isOrphan).length;

  return (
    <>
      {/* ── Sticky toolbar ── */}
      <StickyToolbar>
        <ToolbarSpacer />
        <LayoutControl />
      </StickyToolbar>

      {/* ── Page header ── */}
      <PageHeader
        title="Delivery Summary"
        badge="Broadcast"
        subtitle={`Live delivery health · ${flowItems.length.toLocaleString()} issues tracked`}
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── 4 KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <MiniKpiCard
            label="Completion"
            value={`${metrics.completionRate || 0}%`}
            color={(metrics.completionRate || 0) >= 70 ? '#059669' : '#D97706'}
            bg="#F0FDF4" border="#BBF7D0"
          />
          <MiniKpiCard
            label="Critical Issues"
            value={String(flow.critical || 0)}
            color="#DC2626" bg="#FEF2F2" border="#FECACA"
          />
          <MiniKpiCard
            label="Avg Cycle Time"
            value={`${flow.averageCycleTimeDays || 0}d`}
            color="#475569" bg="#F8FAFC" border="#E2E8F0"
          />
          <MiniKpiCard
            label="Est. Completion"
            value={estimatedDone}
            color="#2563EB" bg="#EFF6FF" border="#BFDBFE"
          />
        </div>

        {/* ── Alert strip ── */}
        {(topBlockers.length > 0 || overdueItems.length > 0 || orphanCount > 0) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {topBlockers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 11, fontWeight: 600, color: '#DC2626' }}>
                <span>🚫</span> {topBlockers.length} blocked
              </div>
            )}
            {overdueItems.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 600, color: '#D97706' }}>
                <span>⏰</span> {overdueItems.length} overdue
              </div>
            )}
            {orphanCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: 11, fontWeight: 600, color: '#0369A1' }}>
                <span>👻</span> {orphanCount} orphans
              </div>
            )}
          </div>
        )}

        {/* ── Smart Actions preview ── */}
        {smartActions.length > 0 && (
          <SectionCard title={`Smart Actions  ·  Top ${Math.min(smartActions.length, 3)} recommendations`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {smartActions.slice(0, 3).map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: i > 0 ? '12px 0 0' : '0',
                  borderTop: i > 0 ? '1px solid #F1F5F9' : 'none',
                  marginTop: i > 0 ? 12 : 0,
                }}>
                  <span style={{ fontSize: 16 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 12, fontWeight: 600, margin: '0 0 2px',
                      color: a.type === 'critical' ? '#DC2626' : a.type === 'warning' ? '#D97706' : '#2563EB',
                    }}>
                      {a.title}
                    </p>
                    <p style={{ fontSize: 10, color: '#64748B', margin: 0 }}>{a.detail}</p>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, flexShrink: 0,
                    background: a.type === 'critical' ? '#FEF2F2' : a.type === 'warning' ? '#FFFBEB' : '#EFF6FF',
                    color: a.type === 'critical' ? '#DC2626' : a.type === 'warning' ? '#D97706' : '#2563EB',
                  }}>
                    {a.suggestedOwner.split(' /')[0]}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Completion snapshot ── */}
        <SectionCard title="Completion Snapshot">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Issues', value: metrics.totalIssues?.toLocaleString() ?? '—' },
              { label: 'Completed', value: metrics.doneIssues?.toLocaleString() ?? '—' },
              { label: 'Active', value: metrics.activeIssues?.toLocaleString() ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </>
  );
}
