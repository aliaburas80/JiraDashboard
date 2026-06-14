'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DeliveryClarityShell from '@/components/dc-shell/DeliveryClarityShell';
import DCKpiCard from '@/components/dc-shell/DCKpiCard';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
const DONE = new Set(['done', 'closed', 'resolved']);

const PALETTE = [
  'var(--dc-brand)',    'var(--dc-action)',   'var(--dc-success)',
  'var(--dc-warning)',  'var(--dc-critical)', 'var(--dc-purple)',
  'var(--dc-info)',     'var(--dc-text-3)',
];

const TYPE_ICONS: Record<string, string> = {
  bug: '🐛', story: '📖', task: '✅', epic: '⚡', 'sub-task': '🔹',
  'test case': '🧪', feature: '🌟', improvement: '🔧', spike: '🔍',
};

export default function DeliveryMixPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadMetricsWithSource().then(r => {
      if (cancelled) return;
      const data = r.metrics as DashboardMetrics | null;
      if (!data) { router.replace('/'); return; }
      setMetrics(data);
    }).catch(() => router.replace('/')).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  if (loading) return <DeliveryClarityShell hideSidebar><LoadingState message="Loading delivery mix…" /></DeliveryClarityShell>;
  if (!metrics) return null;

  const items = (metrics.flow.items ?? []);
  const types = (metrics.types as any[]) ?? [];

  // Build issue type summary from metrics.types or derive from items
  const typeData = types.length > 0 ? types : (() => {
    const map: Record<string, number> = {};
    for (const item of items) { const t = norm(item.type) || 'unknown'; map[t] = (map[t] ?? 0) + 1; }
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  })();

  const total = typeData.reduce((s: number, t: any) => s + (t.count ?? 0), 0) || 1;

  // Donut arcs
  let cursor = 0;
  const arcs = typeData.map((t: any, i: number) => {
    const pct = ((t.count ?? 0) / total) * 100;
    const arc = { ...t, color: PALETTE[i % PALETTE.length], startPct: cursor, pct };
    cursor += pct;
    return arc;
  });

  // Bug ratio
  const bugCount = typeData.filter((t: any) => norm(t.name).includes('bug') || norm(t.name).includes('defect'))
    .reduce((s: number, t: any) => s + (t.count ?? 0), 0);
  const bugRatio = Math.round((bugCount / total) * 100);
  const featureCount = typeData.filter((t: any) => ['story', 'feature', 'improvement', 'task'].some(k => norm(t.name).includes(k)))
    .reduce((s: number, t: any) => s + (t.count ?? 0), 0);
  const testCount = typeData.filter((t: any) => norm(t.name).includes('test'))
    .reduce((s: number, t: any) => s + (t.count ?? 0), 0);

  // Done vs open by type
  const typeDoneMap: Record<string, { done: number; total: number }> = {};
  for (const item of items) {
    const t = norm(item.type) || 'unknown';
    if (!typeDoneMap[t]) typeDoneMap[t] = { done: 0, total: 0 };
    typeDoneMap[t].total++;
    if (DONE.has(norm(item.status))) typeDoneMap[t].done++;
  }

  const maxTypeCount = Math.max(...typeData.map((t: any) => t.count ?? 0), 1);

  return (
    <DeliveryClarityShell hideSidebar>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 20, height: 2, background: 'var(--blue)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase' }}>Delivery</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--n900)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Delivery Mix</h1>
        <p style={{ fontSize: 13, color: 'var(--n500)', margin: '0 0 12px' }}>
          {bugRatio > 30
            ? `${bugRatio}% of work is bugs or defects. Consider reducing technical debt before new features.`
            : `Work mix looks balanced. Features/stories account for ${Math.round((featureCount / total) * 100)}% of capacity.`}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <DCStatusChip label={bugRatio > 30 ? 'High Bug Ratio' : 'Healthy Mix'} tone={bugRatio > 30 ? 'warning' : 'success'} size="md" />
          <DCStatusChip label={`${typeData.length} issue types`} tone="info" size="md" />
        </div>
      </div>

      {/* KPI strip */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} aria-label="Delivery mix metrics">
        <DCKpiCard label="Total Issues" value={total} subtitle={`${typeData.length} types`} tone="neutral" />
        <DCKpiCard label="Feature Work" value={`${Math.round((featureCount / total) * 100)}%`} subtitle={`${featureCount} stories/features`} tone="success" />
        <DCKpiCard label="Bug Ratio" value={`${bugRatio}%`} subtitle={`${bugCount} bugs/defects`} tone={bugRatio > 30 ? 'warning' : 'success'} />
        <DCKpiCard label="Test Coverage" value={`${Math.round((testCount / total) * 100)}%`} subtitle={`${testCount} test cases`} tone={testCount > 0 ? 'info' : 'neutral'} />
      </section>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20 }}>

        {/* Left: Donut + legend */}
        <div className="dc-card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 18px' }}>Issue Type Distribution</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {/* Donut */}
            <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
              <svg width="130" height="130" viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} aria-label="Issue type distribution donut">
                {arcs.map((arc: any, i: number) => {
                  if (arc.pct === 0) return null;
                  const start = (arc.startPct / 100) * Math.PI * 2;
                  const end   = ((arc.startPct + arc.pct) / 100) * Math.PI * 2;
                  const x1 = Math.cos(start) * 0.8; const y1 = Math.sin(start) * 0.8;
                  const x2 = Math.cos(end)   * 0.8; const y2 = Math.sin(end)   * 0.8;
                  const large = arc.pct > 50 ? 1 : 0;
                  return (
                    <path key={i}
                      d={`M 0 0 L ${x1} ${y1} A 0.8 0.8 0 ${large} 1 ${x2} ${y2} Z`}
                      fill={arc.color} opacity="0.85"
                    />
                  );
                })}
                <circle cx="0" cy="0" r="0.52" fill="white" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--dc-text)' }}>{total}</span>
                <span style={{ fontSize: 10, color: 'var(--dc-text-3)', fontWeight: 700 }}>items</span>
              </div>
            </div>

            {/* Legend */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {arcs.slice(0, 8).map((arc: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: arc.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--dc-text-2)', flex: 1, textTransform: 'capitalize' }}>
                    {TYPE_ICONS[arc.name] ?? ''} {arc.name}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: arc.color }}>{arc.count}</span>
                  <span style={{ fontSize: 11, color: 'var(--dc-text-3)', fontWeight: 600 }}>({Math.round(arc.pct)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Work type breakdown */}
        <div className="dc-card" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 18px' }}>Completion by Type</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {typeData.slice(0, 10).map((t: any, i: number) => {
              const doneInfo = typeDoneMap[norm(t.name)] ?? { done: 0, total: t.count ?? 0 };
              const donePct  = doneInfo.total > 0 ? Math.round((doneInfo.done / doneInfo.total) * 100) : 0;
              const widthPct = Math.round(((t.count ?? 0) / maxTypeCount) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-text)', textTransform: 'capitalize' }}>
                      {TYPE_ICONS[norm(t.name)] ?? ''} {t.name}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--dc-text-3)', fontWeight: 600 }}>{doneInfo.done}/{doneInfo.total}</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: donePct >= 70 ? 'var(--dc-success)' : donePct >= 40 ? 'var(--dc-warning)' : 'var(--dc-critical)' }}>{donePct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: 'var(--dc-line)', borderRadius: 4, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${widthPct}%`, background: 'var(--dc-line-2)', borderRadius: 4 }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.round(widthPct * donePct / 100)}%`, background: PALETTE[i % PALETTE.length], borderRadius: 4, transition: 'width 600ms ease-out' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DeliveryClarityShell>
  );
}
