// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  PageHeader, MiniKpiCard, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './page.module.scss';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

// EXCEPTION (CLAUDE.md Rule 1): color values depend on action.type at runtime.
const ACTION_TOKENS: Record<string, { color: string; bg: string }> = {
  critical: { color: 'var(--color-danger-strong)', bg: 'var(--color-danger-soft)' },
  warning:  { color: 'var(--color-warning)',        bg: 'var(--color-warning-soft)' },
  info:     { color: 'var(--color-primary)',         bg: 'var(--color-primary-soft)' },
};

export default function SummaryPage() {
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
      } catch { if (!cancelled) redirectWithLoadError(router); }
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
      acts.push({ type: 'critical', icon: 'priorityBlocker', title: `Unblock ${critBlockers.length} critical item${critBlockers.length > 1 ? 's' : ''}`, detail: `${critBlockers[0].key}: ${(critBlockers[0].summary || (critBlockers[0].reason ?? '')).slice(0, 70)}`, suggestedOwner: 'Scrum Master / Delivery Manager' });
    const staleActive = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('in progress over 14'));
    if (staleActive.length)
      acts.push({ type: 'critical', icon: 'clock', title: `${staleActive.length} item${staleActive.length > 1 ? 's' : ''} stalled in progress`, detail: `${staleActive[0].key} has been active for ${Math.round((staleActive[0] as any).activeAgeDays || 0)} days`, suggestedOwner: 'Engineering Manager' });
    const capacity = ((metrics?.capacity || []) as any[]);
    const overloaded = capacity.filter((c: any) => c.loadShare > 35);
    if (overloaded.length && capacity.length > 2)
      acts.push({ type: 'warning', icon: 'scales', title: 'Team capacity imbalance detected', detail: `${overloaded[0].assignee} carries ${overloaded[0].loadShare}% — consider redistributing`, suggestedOwner: 'Engineering Manager' });
    if (orphans > 0)
      acts.push({ type: 'info', icon: 'question', title: `Link ${orphans} orphan item${orphans > 1 ? 's' : ''} to epics`, detail: 'Items without epic reduce scope traceability and epic completion accuracy', suggestedOwner: 'Product Owner' });
    const epics = (metrics?.epics as any[]) ?? [];
    const critEpics = epics.filter((e: any) => (e.critical ?? 0) > 0);
    if (critEpics.length)
      acts.push({ type: 'warning', icon: 'alert', title: `${critEpics.length} epic${critEpics.length > 1 ? 's' : ''} in critical state`, detail: `${critEpics[0].epic || 'Top epic'}: ${critEpics[0].completion ?? 0}% complete — needs attention`, suggestedOwner: 'Engineering Manager' });
    return acts.slice(0, 5);
  }, [flowItems, metrics]);

  if (loading) return <AppShell showNav><PageLoading /></AppShell>;
  if (!metrics) return null;

  const flow = metrics.flow;
  const prediction = metrics.prediction;
  const estimatedDone = prediction?.complete
    ? 'Done'
    : (prediction?.predictedDate ?? (prediction?.daysRemaining != null ? `~${prediction.daysRemaining}d` : 'N/A'));
  const topBlockers = flowItems.filter(i => norm(i.reason).includes('block')).slice(0, 5);
  const overdueItems = flowItems.filter(i => Number(i.ageDays) > 10 && !DONE_STATUSES.includes(norm(i.status))).slice(0, 5);
  const orphanCount = flowItems.filter(i => i.isOrphan).length;
  const completionRate = metrics.completionRate || 0;

  return (
    <AppShell showNav>
      <PageHeader
        id="tour-header-summary"
        title="Delivery Summary"
        badge="Broadcast"
        subtitle={`Live delivery health · ${flowItems.length.toLocaleString()} issues tracked`}
      />

      <div className={styles.pageContent}>

        {/* ── 4 KPI cards ── */}
        <div id="tour-kpi-grid" className={styles.kpiGrid}>
          <MiniKpiCard
            label="Completion"
            value={`${completionRate}%`}
            color={completionRate >= 70 ? 'var(--color-health-excellent-text)' : 'var(--color-warning)'}
            bg="var(--color-success-soft)"
            border="var(--color-success-border)"
          />
          <MiniKpiCard
            label="Critical Issues"
            value={String(flow.critical || 0)}
            color="var(--color-danger-strong)"
            bg="var(--color-danger-soft)"
            border="var(--color-danger-border)"
          />
          <MiniKpiCard
            label="Avg Cycle Time"
            value={`${flow.averageCycleTimeDays || 0}d`}
            color="var(--color-text-secondary)"
            bg="var(--color-subtle)"
            border="var(--color-border)"
            confidence={metrics.confidence?.cycleTime}
          />
          <MiniKpiCard
            label="Est. Completion"
            value={estimatedDone}
            color="var(--color-primary)"
            bg="var(--color-primary-soft)"
            border="var(--color-primary-border)"
          />
        </div>

        {/* ── Alert strip ── */}
        {(topBlockers.length > 0 || overdueItems.length > 0 || orphanCount > 0) && (
          <div id="tour-section-summary-1" className={styles.alertStrip}>
            {topBlockers.length > 0 && (
              <div className={`${styles.alertChip} ${styles.alertChipBlocked}`}>
                <SvgIcon name="priorityBlocker" size={14} /> {topBlockers.length} blocked
              </div>
            )}
            {overdueItems.length > 0 && (
              <div className={`${styles.alertChip} ${styles.alertChipOverdue}`}>
                <SvgIcon name="clock" size={14} /> {overdueItems.length} overdue
              </div>
            )}
            {orphanCount > 0 && (
              <div className={`${styles.alertChip} ${styles.alertChipOrphan}`}>
                <SvgIcon name="question" size={14} /> {orphanCount} orphans
              </div>
            )}
          </div>
        )}

        {/* ── Smart Actions preview ── */}
        {smartActions.length > 0 && (
          <SectionCard title={`Smart Actions  ·  Top ${Math.min(smartActions.length, 3)} recommendations`}>
            <div id="tour-section-summary-2" className={styles.actionList}>
              {smartActions.slice(0, 3).map((a, i) => {
                const tok = ACTION_TOKENS[a.type] ?? ACTION_TOKENS.info;
                return (
                  <div key={i} className={styles.actionRow}>
                    <span className={styles.actionIcon}><SvgIcon name={a.icon} size={18} /></span>
                    <div className={styles.actionBody}>
                      {/* --action-color is data-driven (action.type) */}
                      <p className={styles.actionTitle} style={{ '--action-color': tok.color } as CSSProperties}>
                        {a.title}
                      </p>
                      <p className={styles.actionDetail}>{a.detail}</p>
                    </div>
                    {/* --owner-bg / --owner-color are data-driven (action.type) */}
                    <span className={styles.actionOwner} style={{ '--owner-bg': tok.bg, '--owner-color': tok.color } as CSSProperties}>
                      {a.suggestedOwner.split(' /')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ── Completion snapshot ── */}
        <SectionCard title="Completion Snapshot">
          <div className={styles.snapshotGrid}>
            {[
              { label: 'Total Issues', value: metrics.totalIssues?.toLocaleString() ?? '—' },
              { label: 'Completed',    value: metrics.doneIssues?.toLocaleString()  ?? '—' },
              { label: 'Active',       value: metrics.activeIssues?.toLocaleString() ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className={styles.snapshotLabel}>{label}</p>
                <p className={styles.snapshotValue}>{value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </AppShell>
  );
}
