'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import DCKpiCard from '@/components/dc-shell/DCKpiCard';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';

const DONE = new Set(['done', 'closed', 'resolved']);
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

const AGE_BRACKETS = [
  { label: '0–3 days',   min: 0,  max: 3  },
  { label: '4–7 days',   min: 4,  max: 7  },
  { label: '8–14 days',  min: 8,  max: 14 },
  { label: '15–30 days', min: 15, max: 30 },
  { label: '30+ days',   min: 31, max: Infinity },
];

export default function FlowHealthPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItems, setDrawerItems] = useState<FlowItem[]>([]);
  const [drawerTitle, setDrawerTitle] = useState('');

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

  if (loading) return <AppShell showNav><LoadingState message="Loading flow health…" /></AppShell>;
  if (!metrics) return null;

  const flow  = metrics.flow;
  const items = flow.items ?? [];
  const activeItems = items.filter(i => !DONE.has(norm(i.status)));

  // Bottleneck map: group active items by status
  const statusMap: Record<string, { count: number; critCount: number; warnCount: number; items: FlowItem[] }> = {};
  for (const item of activeItems) {
    const s = norm(item.status) || 'unknown';
    if (!statusMap[s]) statusMap[s] = { count: 0, critCount: 0, warnCount: 0, items: [] };
    statusMap[s].count++;
    if (item.health === 'critical') statusMap[s].critCount++;
    if (item.health === 'warning')  statusMap[s].warnCount++;
    statusMap[s].items.push(item);
  }
  const statusEntries = Object.entries(statusMap).sort((a, b) => b[1].count - a[1].count);
  const maxCount = statusEntries[0]?.[1].count ?? 1;

  // Aging distribution of active items
  const agingData = AGE_BRACKETS.map(b => ({
    ...b,
    count: activeItems.filter(i => {
      const age = Number(i.ageDays ?? 0);
      return age >= b.min && age <= b.max;
    }).length,
  }));
  const maxAging = Math.max(...agingData.map(b => b.count), 1);

  const critItems   = items.filter(i => i.health === 'critical' && !DONE.has(norm(i.status)));
  const blockers    = items.filter(i => norm(i.reason).includes('block'));
  const oldItems    = activeItems.filter(i => Number(i.ageDays ?? 0) > 14);
  const flowEff     = flow.issues > 0 ? Math.round((flow.done / flow.issues) * 100) : 0;

  function openDrawer(title: string, list: FlowItem[]) {
    setDrawerTitle(title);
    setDrawerItems(list.slice(0, 100));
    setDrawerOpen(true);
  }

  return (
    <AppShell showNav>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ width: 20, height: 2, background: 'var(--blue)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase' }}>Delivery</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--n900)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Flow Health</h1>
        <p style={{ fontSize: 13, color: 'var(--n500)', margin: '0 0 12px' }}>
          {flow.critical > 0
            ? `${flow.critical} critical item${flow.critical !== 1 ? 's' : ''} are blocking flow. Address blockers first to restore delivery pace.`
            : 'Flow is stable. Monitor aging WIP and maintain lead time targets.'}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <DCStatusChip label={flow.critical > 0 ? 'Flow Risk' : 'Flow Stable'} tone={flow.critical > 0 ? 'critical' : 'success'} size="md" />
          {blockers.length > 0 && <DCStatusChip label={`${blockers.length} Blockers`} tone="critical" size="md" />}
          {oldItems.length > 0 && <DCStatusChip label={`${oldItems.length} Aging`} tone="warning" size="md" />}
          <button type="button" className="dc-btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => openDrawer('All Flow Items', activeItems)}>
            View all items ({activeItems.length})
          </button>
          <Link href="/work-explorer" className="dc-btn-action" style={{ textDecoration: 'none' }}>
            Work Explorer →
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} aria-label="Flow metrics">
        <DCKpiCard label="Avg Lead Time"  value={`${flow.averageLeadTimeDays ?? 0}d`}  subtitle={`${flow.leadTimeSampleSize ?? 0} completed`} tone={(flow.averageLeadTimeDays ?? 0) > 20 ? 'warning' : 'success'} />
        <DCKpiCard label="Avg Cycle Time" value={`${flow.averageCycleTimeDays ?? 0}d`} subtitle={`${flow.cycleTimeSampleSize ?? 0} with start`} tone={(flow.averageCycleTimeDays ?? 0) > 10 ? 'warning' : 'success'} />
        <DCKpiCard label="Flow Efficiency" value={`${flowEff}%`} subtitle={`${flow.done} of ${flow.issues} done`} tone={flowEff >= 60 ? 'success' : flowEff >= 30 ? 'warning' : 'critical'} />
        <DCKpiCard label="Aging WIP"  value={oldItems.length} subtitle="Active > 14 days" tone={oldItems.length > 10 ? 'critical' : oldItems.length > 4 ? 'warning' : 'success'} onClick={() => openDrawer('Aging WIP (>14 days)', oldItems)} />
      </section>

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 320px', gap: 20 }}>

        {/* Left: Bottleneck map */}
        <div className="dc-card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--dc-text)', margin: 0 }}>Bottleneck Map</h2>
              <p style={{ fontSize: 12, color: 'var(--dc-text-2)', margin: '3px 0 0' }}>Active work distribution by stage</p>
            </div>
          </div>

          {statusEntries.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--dc-text-3)', padding: '32px 0', textAlign: 'center' }}>No active work items</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {statusEntries.map(([status, data]) => {
                const pct = Math.round((data.count / maxCount) * 100);
                const hasCrit = data.critCount > 0;
                const hasWarn = data.warnCount > 0;
                const barColor = hasCrit ? 'var(--dc-critical)' : hasWarn ? 'var(--dc-warning)' : 'var(--dc-brand)';
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-text)', textTransform: 'capitalize' }}>{status}</span>
                        {hasCrit && <DCStatusChip label={`${data.critCount} critical`} tone="critical" />}
                        {!hasCrit && hasWarn && <DCStatusChip label={`${data.warnCount} warning`} tone="warning" />}
                      </div>
                      <button
                        type="button"
                        onClick={() => openDrawer(`${status} items`, data.items)}
                        style={{ fontSize: 12, fontWeight: 800, color: barColor, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {data.count} →
                      </button>
                    </div>
                    <div style={{ height: 10, background: 'var(--dc-line)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 5, transition: 'width 600ms ease-out' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Aging distribution + blockers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Aging distribution */}
          <div className="dc-card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 14px' }}>Aging Distribution</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agingData.map(b => {
                const pct = Math.round((b.count / maxAging) * 100);
                const tone = b.min >= 30 ? 'var(--dc-critical)' : b.min >= 15 ? 'var(--dc-warning)' : 'var(--dc-success)';
                return (
                  <div key={b.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--dc-text-2)' }}>{b.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: tone }}>{b.count}</span>
                    </div>
                    <div style={{ height: 7, background: 'var(--dc-line)', borderRadius: 4 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: tone, borderRadius: 4, transition: 'width 600ms ease-out' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top blockers */}
          {blockers.length > 0 && (
            <div className="dc-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--dc-text)', margin: 0 }}>Blockers</h2>
                <button type="button" onClick={() => openDrawer('All blockers', blockers)} style={{ fontSize: 11, fontWeight: 800, color: 'var(--dc-brand)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  View all ({blockers.length})
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {blockers.slice(0, 5).map(item => (
                  <div key={item.key} style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--dc-critical-soft)', border: '1px solid rgba(244,63,94,0.2)',
                  }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--dc-critical)', fontFamily: 'monospace' }}>{item.key}</span>
                      <DCStatusChip label={item.status} tone="critical" />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--dc-text)', margin: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical items */}
          {critItems.length > 0 && (
            <div className="dc-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--dc-text)', margin: 0 }}>Critical Items</h2>
                <button type="button" onClick={() => openDrawer('Critical items', critItems)} style={{ fontSize: 11, fontWeight: 800, color: 'var(--dc-critical)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  View all ({critItems.length})
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {critItems.slice(0, 5).map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--dc-surface-soft)', border: '1px solid var(--dc-line)' }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--dc-brand)', fontFamily: 'monospace', flexShrink: 0 }}>{item.key}</span>
                    <span style={{ fontSize: 12, color: 'var(--dc-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--dc-text-3)', flexShrink: 0 }}>{item.ageDays ?? 0}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(6,26,51,0.5)' }} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div style={{
            width: 600, background: 'white', overflowY: 'auto', height: '100%',
            padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
            boxShadow: 'var(--dc-shadow-panel)',
          }} role="dialog" aria-label={drawerTitle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--dc-text)', margin: 0 }}>{drawerTitle}</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--dc-text-2)' }} aria-label="Close">×</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--dc-line)' }}>
                    {['Key', 'Summary', 'Status', 'Type', 'Age (d)', 'Health'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: 'var(--dc-text-3)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drawerItems.map((item, i) => (
                    <tr key={item.key} style={{ borderBottom: '1px solid var(--dc-line)', background: i % 2 ? 'var(--dc-surface-soft)' : 'white' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--dc-brand)', whiteSpace: 'nowrap' }}>{item.key}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--dc-text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}><DCStatusChip label={item.status} tone="neutral" /></td>
                      <td style={{ padding: '7px 10px', color: 'var(--dc-text-2)', whiteSpace: 'nowrap' }}>{item.type}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 800, color: Number(item.ageDays ?? 0) > 14 ? 'var(--dc-critical)' : 'var(--dc-text-2)', textAlign: 'right' }}>{item.ageDays ?? 0}</td>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                        <DCStatusChip label={item.health} tone={item.health === 'critical' ? 'critical' : item.health === 'warning' ? 'warning' : 'success'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
