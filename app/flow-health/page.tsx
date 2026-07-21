'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import DCKpiCard from '@/components/dc-shell/DCKpiCard';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import styles from './page.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

const DONE = new Set(['done', 'closed', 'resolved']);
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

type AgingTone = 'success' | 'warning' | 'critical';

const AGE_BRACKETS: { label: string; min: number; max: number; tone: AgingTone }[] = [
  { label: '0–3 days',   min: 0,  max: 3,        tone: 'success'  },
  { label: '4–7 days',   min: 4,  max: 7,        tone: 'success'  },
  { label: '8–14 days',  min: 8,  max: 14,       tone: 'success'  },
  { label: '15–30 days', min: 15, max: 30,       tone: 'warning'  },
  { label: '30+ days',   min: 31, max: Infinity, tone: 'critical' },
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
    }).catch(() => redirectWithLoadError(router)).finally(() => { if (!cancelled) setLoading(false); });
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
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderKicker}>
          <span className={styles.kickerBar} />
          <span className={styles.kickerLabel}>Delivery</span>
        </div>
        <h1 id="tour-header-flow-health" className={styles.pageTitle}>Flow Health</h1>
        <p className={styles.pageDesc}>
          {flow.critical > 0
            ? `${flow.critical} critical item${flow.critical !== 1 ? 's' : ''} are blocking flow. Address blockers first to restore delivery pace.`
            : 'Flow is stable. Monitor aging WIP and maintain lead time targets.'}
        </p>
        <div className={styles.headerActions}>
          <DCStatusChip label={flow.critical > 0 ? 'Flow Risk' : 'Flow Stable'} tone={flow.critical > 0 ? 'critical' : 'success'} size="md" />
          {blockers.length > 0 && <DCStatusChip label={`${blockers.length} Blockers`} tone="critical" size="md" />}
          {oldItems.length > 0 && <DCStatusChip label={`${oldItems.length} Aging`} tone="warning" size="md" />}
          <button type="button" className={clsx('dc-btn-ghost', styles.viewAllBtn)} onClick={() => openDrawer('All Flow Items', activeItems)}>
            View all items ({activeItems.length})
          </button>
          <Link href="/work-explorer" className={clsx('dc-btn-action', styles.explorerLink)}>
            Work Explorer →
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <section id="tour-section-flow-health-1" className={styles.kpiGrid} aria-label="Flow metrics">
        {/* AUDIT-CP3-002/CP3-004: a zero-sample average previously rendered as
            a green "success" tone with no reliability signal. Both the tone
            and an explicit confidence badge now reflect the real sample size. */}
        <DCKpiCard label="Avg Lead Time"  value={`${flow.averageLeadTimeDays ?? 0}d`}  subtitle={`${flow.leadTimeSampleSize ?? 0} completed`} tone={(flow.leadTimeSampleSize ?? 0) === 0 ? 'neutral' : (flow.averageLeadTimeDays ?? 0) > 20 ? 'warning' : 'success'} confidence={metrics.confidence?.leadTime} />
        <DCKpiCard label="Avg Cycle Time" value={`${flow.averageCycleTimeDays ?? 0}d`} subtitle={`${flow.cycleTimeSampleSize ?? 0} with start`} tone={(flow.cycleTimeSampleSize ?? 0) === 0 ? 'neutral' : (flow.averageCycleTimeDays ?? 0) > 10 ? 'warning' : 'success'} confidence={metrics.confidence?.cycleTime} />
        <DCKpiCard label="Flow Efficiency" value={`${flowEff}%`} subtitle={`${flow.done} of ${flow.issues} done`} tone={flowEff >= 60 ? 'success' : flowEff >= 30 ? 'warning' : 'critical'} />
        <DCKpiCard label="Aging WIP"  value={oldItems.length} subtitle="Active > 14 days" tone={oldItems.length > 10 ? 'critical' : oldItems.length > 4 ? 'warning' : 'success'} onClick={() => openDrawer('Aging WIP (>14 days)', oldItems)} />
      </section>

      {/* Two-column content */}
      <div className={styles.columns}>

        {/* Left: Bottleneck map */}
        <div className={clsx('dc-card', styles.cardPad)}>
          <div id="tour-section-flow-health-2" className={styles.cardHead}>
            <div>
              <h2 className={styles.cardTitle}>Bottleneck Map</h2>
              <p className={styles.cardSubtitle}>Active work distribution by stage</p>
            </div>
          </div>

          {statusEntries.length === 0 ? (
            <p className={styles.emptyRow}>No active work items</p>
          ) : (
            <div className={styles.bottleneckList}>
              {statusEntries.map(([status, data]) => {
                const pct = Math.round((data.count / maxCount) * 100);
                const hasCrit = data.critCount > 0;
                const hasWarn = data.warnCount > 0;
                const tone = hasCrit ? 'critical' : hasWarn ? 'warning' : undefined;
                return (
                  <div key={status}>
                    <div className={styles.bottleneckHead}>
                      <div className={styles.bottleneckLabelRow}>
                        <span className={styles.bottleneckLabel}>{status}</span>
                        {hasCrit && <DCStatusChip label={`${data.critCount} critical`} tone="critical" />}
                        {!hasCrit && hasWarn && <DCStatusChip label={`${data.warnCount} warning`} tone="warning" />}
                      </div>
                      <button
                        type="button"
                        onClick={() => openDrawer(`${status} items`, data.items)}
                        className={styles.bottleneckCountBtn}
                        data-tone={tone}
                      >
                        {data.count} →
                      </button>
                    </div>
                    <div className={styles.barTrack}>
                      {/* DYNAMIC CSS VARIABLE: bar width is this status's share of the busiest status, cannot be predefined. */}
                      <div className={styles.barFill} data-tone={tone} style={{ '--bar-width': `${pct}%` } as CSSVars} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Aging distribution + blockers */}
        <div className={styles.rightCol}>
          {/* Aging distribution */}
          <div className={clsx('dc-card', styles.cardPadSm)}>
            <h2 className={styles.cardTitleSm}>Aging Distribution</h2>
            <div className={styles.agingList}>
              {agingData.map(b => {
                const pct = Math.round((b.count / maxAging) * 100);
                return (
                  <div key={b.label}>
                    <div className={styles.agingHead}>
                      <span className={styles.agingLabel}>{b.label}</span>
                      <span className={styles.agingCount} data-tone={b.tone}>{b.count}</span>
                    </div>
                    <div className={styles.agingBarTrack}>
                      {/* DYNAMIC CSS VARIABLE: bar width is this bracket's share of the largest bracket, cannot be predefined. */}
                      <div className={styles.agingBarFill} data-tone={b.tone} style={{ '--bar-width': `${pct}%` } as CSSVars} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top blockers */}
          {blockers.length > 0 && (
            <div className={clsx('dc-card', styles.cardPadSm)}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitleFlex}>Blockers</h2>
                <button type="button" onClick={() => openDrawer('All blockers', blockers)} className={clsx(styles.viewAllLink, styles['viewAllLink--critical'])}>
                  View all ({blockers.length})
                </button>
              </div>
              <div className={styles.listGap8}>
                {blockers.slice(0, 5).map(item => (
                  <div key={item.key} className={styles.blockerCard}>
                    <div className={styles.blockerHead}>
                      <span className={styles.blockerKey}>{item.key}</span>
                      <DCStatusChip label={item.status} tone="critical" />
                    </div>
                    <p className={styles.blockerSummary}>
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical items */}
          {critItems.length > 0 && (
            <div className={clsx('dc-card', styles.cardPadSm)}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitleFlex}>Critical Items</h2>
                <button type="button" onClick={() => openDrawer('Critical items', critItems)} className={styles.viewAllLink}>
                  View all ({critItems.length})
                </button>
              </div>
              <div className={styles.listGap6}>
                {critItems.slice(0, 5).map(item => (
                  <div key={item.key} className={styles.criticalItemRow}>
                    <span className={styles.criticalItemKey}>{item.key}</span>
                    <span className={styles.criticalItemSummary}>{item.summary}</span>
                    <span className={styles.criticalItemAge}>{item.ageDays ?? 0}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawerScrim} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className={styles.drawerPanel} role="dialog" aria-label={drawerTitle}>
            <div className={styles.drawerHead}>
              <h2 className={styles.drawerTitle}>{drawerTitle}</h2>
              <button type="button" onClick={() => setDrawerOpen(false)} className={styles.drawerCloseBtn} aria-label="Close">×</button>
            </div>
            <div className={styles.drawerTableWrap}>
              <table className={styles.drawerTable}>
                <thead>
                  <tr className={styles.drawerHeadRow}>
                    {['Key', 'Summary', 'Status', 'Type', 'Age (d)', 'Health'].map(h => (
                      <th key={h} className={styles.drawerHeadCell}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drawerItems.map(item => (
                    <tr key={item.key} className={styles.drawerRow}>
                      <td className={styles.drawerCellKey}>{item.key}</td>
                      <td className={styles.drawerCellSummary}>{item.summary}</td>
                      <td className={styles.drawerCellNowrap}><DCStatusChip label={item.status} tone="neutral" /></td>
                      <td className={styles.drawerCellType}>{item.type}</td>
                      <td className={styles.drawerCellAge} data-aging={Number(item.ageDays ?? 0) > 14}>{item.ageDays ?? 0}</td>
                      <td className={styles.drawerCellNowrap}>
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
