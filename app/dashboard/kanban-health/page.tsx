// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const ACTIVE_STATUSES = ['in progress', 'code review', 'qa', 'testing', 'uat'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

export default function KanbanHealthPage() {
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

  const statusCols = useMemo(() => {
    const map = new Map<string, number>();
    flowItems.forEach(i => { const s = String(i.status ?? 'Unknown'); map.set(s, (map.get(s) ?? 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [flowItems]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const kanban = metrics.kanban as any;
  const flow = metrics.flow;
  const wipItems = flowItems.filter(i => ACTIVE_STATUSES.includes(norm(i.status)));
  const blockedItems = flowItems.filter(i => norm(i.reason).includes('block'));
  const agingItems = flowItems.filter(i => Number(i.ageDays) > 14 && !DONE_STATUSES.includes(norm(i.status)));
  const doneCount = flowItems.filter(i => DONE_STATUSES.includes(norm(i.status))).length;
  const boardHealth = (flow.critical || 0) < 50 ? 'Good' : (flow.critical || 0) < 200 ? 'Mixed' : 'Poor';
  const boardHealthColor = boardHealth === 'Good' ? '#059669' : boardHealth === 'Mixed' ? '#D97706' : '#DC2626';
  const statusMax = Math.max(...statusCols.map(r => r.count), 1);

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        id="tour-header-kanban-health"
        title="Kanban Health"
        badge={boardHealth}
        subtitle="Board health, WIP, throughput, aging, and flow distribution."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Health gauges ── */}
        <div id="tour-section-kanban-health-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Board Health', value: boardHealth, color: boardHealthColor, bg: '#F8FAFC', border: '#E2E8F0' },
            { label: 'WIP', value: wipItems.length, color: wipItems.length > 20 ? '#DC2626' : '#475569', bg: '#F8FAFC', border: '#E2E8F0' },
            { label: 'Blocked', value: blockedItems.length, color: blockedItems.length > 0 ? '#DC2626' : '#059669', bg: '#FEF2F2', border: '#FECACA' },
            { label: 'Throughput', value: doneCount, color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Flow metrics ── */}
        <SectionCard title="Flow Metrics">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Avg Cycle Time', value: `${flow.averageCycleTimeDays || 0}d`, sub: `${flow.cycleTimeSampleSize || 0} completed items` },
              { label: 'Avg Lead Time', value: `${flow.averageLeadTimeDays || 0}d`, sub: `${flow.leadTimeSampleSize || 0} items` },
              { label: 'Aging (>14d)', value: agingItems.length, sub: 'Items past threshold' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ padding: '12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', margin: '0 0 2px' }}>{value}</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Board status distribution ── */}
        <SectionCard title="Work Distribution by Status">
          <div id="tour-section-kanban-health-2" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statusCols.map((r, i) => {
              const isDone = DONE_STATUSES.includes(norm(r.name));
              const isActive = ACTIVE_STATUSES.includes(norm(r.name));
              const color = isDone ? '#059669' : isActive ? '#2563EB' : '#94A3B8';
              return (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 140, fontSize: 12, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.name}>{r.name}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: color, width: `${(r.count / statusMax) * 100}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 55}ms` }} />
                  </div>
                  <strong style={{ fontFamily: 'monospace', fontSize: 11, color, width: 40, textAlign: 'right', flexShrink: 0 }}>{r.count}</strong>
                </div>
              );
            })}
            {statusCols.length === 0 && <p style={{ fontSize: 12, color: '#94A3B8' }}>No board data.</p>}
          </div>
        </SectionCard>

        {/* ── Kanban throughput if available ── */}
        {kanban?.throughput && (
          <SectionCard title="Kanban Throughput">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {Object.entries(kanban.throughput).map(([key, val]) => (
                <div key={key}>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{key}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', margin: 0 }}>{String(val)}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}
