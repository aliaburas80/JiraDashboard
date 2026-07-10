// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const ACTIVE_STATUSES = ['in progress', 'code review', 'qa', 'testing', 'uat'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

export default function DeliveryControlsPage() {
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

  const flow = metrics.flow;
  const activeItems = flowItems.filter(i => ACTIVE_STATUSES.includes(norm(i.status)));
  const blockedItems = flowItems.filter(i => norm(i.reason).includes('block'));
  const agingItems = flowItems.filter(i => Number(i.ageDays) > 30 && !DONE_STATUSES.includes(norm(i.status))).sort((a, b) => Number(b.ageDays ?? 0) - Number(a.ageDays ?? 0));
  const criticalItems = flowItems.filter(i => i.health === 'critical');
  const wipLimit = 15;
  const wip = activeItems.length;
  const wipStatus = wip > wipLimit * 1.5 ? 'Degraded' : wip > wipLimit ? 'High' : 'OK';
  const wipColor = wipStatus === 'Degraded' ? '#DC2626' : wipStatus === 'High' ? '#D97706' : '#059669';

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        id="tour-header-delivery-controls"
        title="Delivery Controls"
        badge={wipStatus}
        subtitle="WIP, blocked items, aging work, flow efficiency, and risk thresholds."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Control gauges ── */}
        <div id="tour-section-delivery-controls-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'WIP', value: wip, status: wipStatus, color: wipColor, bg: wipStatus === 'Degraded' ? '#FEF2F2' : '#F8FAFC', border: wipStatus === 'Degraded' ? '#FECACA' : '#E2E8F0' },
            { label: 'Blocked', value: blockedItems.length, status: blockedItems.length > 20 ? 'Critical' : blockedItems.length > 5 ? 'High' : 'Low', color: blockedItems.length > 0 ? '#DC2626' : '#059669', bg: '#FEF2F2', border: '#FECACA' },
            { label: 'Aging (>30d)', value: agingItems.length, status: agingItems.length > 20 ? 'High' : 'OK', color: agingItems.length > 10 ? '#D97706' : '#475569', bg: '#FFFBEB', border: '#FDE68A' },
            { label: 'Critical', value: criticalItems.length, status: criticalItems.length > 100 ? 'Degraded' : 'OK', color: criticalItems.length > 0 ? '#DC2626' : '#059669', bg: '#FEF2F2', border: '#FECACA' },
          ].map(({ label, value, status, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, margin: '0 0 4px' }}>{value.toLocaleString()}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color, margin: 0 }}>{status}</p>
            </div>
          ))}
        </div>

        {/* ── Flow metrics ── */}
        <SectionCard title="Flow Efficiency">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Lead Time', value: `${flow.averageLeadTimeDays || 0}d`, sub: 'Avg across completed items' },
              { label: 'Cycle Time', value: `${flow.averageCycleTimeDays || 0}d`, sub: 'Avg active time' },
              { label: 'Throughput', value: `${metrics.doneIssues || 0}`, sub: 'Items completed' },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ padding: '12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', margin: '0 0 2px' }}>{value}</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{sub}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Aging work ── */}
        {agingItems.length > 0 && (
          <SectionCard title={`Aging Work (>30d)  ·  ${agingItems.length} items`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead id="tour-section-delivery-controls-2">
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['Key', 'Summary', 'Status', 'Age (d)', 'Assignee'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agingItems.slice(0, 30).map((item, i) => (
                    <tr key={item.key ?? i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#2563EB', fontWeight: 700 }}>{item.key}</td>
                      <td style={{ padding: '7px 10px', color: '#334155', maxWidth: 260 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</span>
                      </td>
                      <td style={{ padding: '7px 10px', color: '#64748B' }}>{item.status}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: Number(item.ageDays) > 60 ? '#DC2626' : '#D97706' }}>{item.ageDays}</td>
                      <td style={{ padding: '7px 10px', color: '#64748B' }}>{item.assignee ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {agingItems.length > 30 && <p style={{ fontSize: 11, color: '#94A3B8', padding: '6px 10px' }}>Showing 30 of {agingItems.length} aging items</p>}
            </div>
          </SectionCard>
        )}

        {/* ── Blocked items ── */}
        {blockedItems.length > 0 && (
          <SectionCard title={`Blocked Items  ·  ${blockedItems.length} items`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    {['Key', 'Summary', 'Reason', 'Assignee'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blockedItems.slice(0, 20).map((item, i) => (
                    <tr key={item.key ?? i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#DC2626', fontWeight: 700 }}>{item.key}</td>
                      <td style={{ padding: '7px 10px', color: '#334155', maxWidth: 260 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</span>
                      </td>
                      <td style={{ padding: '7px 10px', color: '#64748B', maxWidth: 200 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.reason ?? '—'}</span>
                      </td>
                      <td style={{ padding: '7px 10px', color: '#64748B' }}>{item.assignee ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}
