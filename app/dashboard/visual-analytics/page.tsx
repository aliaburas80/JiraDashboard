// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, LayoutControl,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
const PALETTE = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

function CompactBar({ label, value, max, color, index = 0 }: { label: string; value: number; max: number; color: string; index?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#334155' }} title={label}>{label}</span>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, background: color, width: `${(value / Math.max(max, 1)) * 100}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${index * 60}ms` }} />
      </div>
      <strong style={{ fontFamily: 'monospace', fontSize: 11, color, width: 36, textAlign: 'right', flexShrink: 0 }}>{value}</strong>
    </div>
  );
}

export default function VisualAnalyticsPage() {
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

  const statusDist = useMemo(() => {
    const map = new Map<string, number>();
    flowItems.forEach(i => { const s = String(i.status ?? 'Unknown'); map.set(s, (map.get(s) ?? 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [flowItems]);

  const typeDist = useMemo(() => {
    const map = new Map<string, number>();
    flowItems.forEach(i => { const t = String(i.type ?? 'Unknown'); map.set(t, (map.get(t) ?? 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [flowItems]);

  const assigneeDist = useMemo(() => {
    const map = new Map<string, number>();
    flowItems.forEach(i => { if (i.assignee) map.set(String(i.assignee), (map.get(String(i.assignee)) ?? 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [flowItems]);

  const healthDist = useMemo(() => {
    const map = new Map<string, number>();
    flowItems.forEach(i => { const h = String(i.health ?? 'good'); map.set(h, (map.get(h) ?? 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count }));
  }, [flowItems]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const flow = metrics.flow;
  const statusMax = Math.max(...statusDist.map(r => r.count), 1);
  const typeMax = Math.max(...typeDist.map(r => r.count), 1);
  const assigneeMax = Math.max(...assigneeDist.map(r => r.count), 1);

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />
        <LayoutControl />
      </StickyToolbar>

      <PageHeader
        title="Visual Analytics"
        subtitle="Charts, distributions, and visual delivery analysis."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Summary strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Items', value: flowItems.length.toLocaleString(), color: '#2563EB' },
            { label: 'Done', value: flowItems.filter(i => DONE_STATUSES.includes(norm(i.status))).length.toLocaleString(), color: '#059669' },
            { label: 'At Risk', value: ((flow.critical || 0) + (flow.warning || 0)).toLocaleString(), color: '#DC2626' },
            { label: 'Active', value: (metrics.activeIssues || 0).toLocaleString(), color: '#D97706' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* ── Status distribution ── */}
          <SectionCard title="Work by Status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statusDist.map((r, i) => (
                <CompactBar key={r.name} label={r.name} value={r.count} max={statusMax} color={PALETTE[i % PALETTE.length]} index={i} />
              ))}
              {statusDist.length === 0 && <p style={{ fontSize: 12, color: '#94A3B8' }}>No data.</p>}
            </div>
          </SectionCard>

          {/* ── Type distribution ── */}
          <SectionCard title="Work by Type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {typeDist.map((r, i) => (
                <CompactBar key={r.name} label={r.name} value={r.count} max={typeMax} color={PALETTE[(i + 2) % PALETTE.length]} index={i} />
              ))}
              {typeDist.length === 0 && <p style={{ fontSize: 12, color: '#94A3B8' }}>No data.</p>}
            </div>
          </SectionCard>

          {/* ── Assignee workload ── */}
          <SectionCard title="Workload by Assignee">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assigneeDist.map((r, i) => (
                <CompactBar key={r.name} label={r.name} value={r.count} max={assigneeMax} color={PALETTE[(i + 1) % PALETTE.length]} index={i} />
              ))}
              {assigneeDist.length === 0 && <p style={{ fontSize: 12, color: '#94A3B8' }}>No assignee data.</p>}
            </div>
          </SectionCard>

          {/* ── Health distribution ── */}
          <SectionCard title="Health Distribution">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {healthDist.map(({ name, count }) => {
                const color = name === 'critical' ? '#DC2626' : name === 'warning' ? '#D97706' : '#059669';
                const pct = Math.round((count / Math.max(flowItems.length, 1)) * 100);
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span style={{ color: '#334155', textTransform: 'capitalize', fontWeight: 600 }}>{name}</span>
                      <span style={{ fontFamily: 'monospace', color, fontWeight: 700 }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: color, width: `${pct}%`, animation: 'barFill 800ms ease-out both', transformOrigin: 'left center' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
