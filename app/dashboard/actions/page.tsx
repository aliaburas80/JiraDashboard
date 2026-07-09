// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer,
  PageHeader, PageLoading, shellStyles,
} from '@/components/dashboard/DashboardPageShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './page.module.scss';

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

type ActionType = { type: string; icon: string; title: string; detail: string; suggestedOwner: string; status: 'open' | 'resolved' };

// Data-driven color tokens for each action type.
// EXCEPTION (CLAUDE.md Rule 1): these are set as CSS custom properties in JSX.
const TYPE_TOKENS: Record<string, { bg: string; border: string; color: string }> = {
  critical: { bg: 'var(--color-danger-soft)',  border: 'var(--color-danger-border)',  color: 'var(--color-danger-strong)' },
  warning:  { bg: 'var(--color-warning-soft)', border: 'var(--color-warning-border)', color: 'var(--color-warning)'       },
  info:     { bg: 'var(--color-primary-soft)', border: 'var(--color-primary-border)', color: 'var(--color-primary)'       },
};

export default function SmartActionsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

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

  const actions: ActionType[] = useMemo(() => {
    if (!metrics) return [];
    const acts: ActionType[] = [];
    const orphans = flowItems.filter(i => i.isOrphan).length;
    const critBlockers = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('block'));
    if (critBlockers.length)
      acts.push({ type: 'critical', icon: 'priorityBlocker', status: 'open',
        title: `Unblock ${critBlockers.length} critical item${critBlockers.length > 1 ? 's' : ''}`,
        detail: `${critBlockers[0].key}: ${(critBlockers[0].summary || (critBlockers[0].reason ?? '')).slice(0, 80)}`,
        suggestedOwner: 'Scrum Master / Delivery Manager' });
    const staleActive = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('in progress over 14'));
    if (staleActive.length)
      acts.push({ type: 'critical', icon: 'clock', status: 'open',
        title: `${staleActive.length} item${staleActive.length > 1 ? 's' : ''} stalled in progress`,
        detail: `${staleActive[0].key} has been active for ${Math.round((staleActive[0] as any).activeAgeDays || 0)} days`,
        suggestedOwner: 'Engineering Manager' });
    const capacity = ((metrics?.capacity || []) as any[]);
    const overloaded = capacity.filter((c: any) => c.loadShare > 35);
    if (overloaded.length && capacity.length > 2)
      acts.push({ type: 'warning', icon: 'scales', status: 'open',
        title: 'Team capacity imbalance detected',
        detail: `${overloaded[0].assignee} carries ${overloaded[0].loadShare}% — consider redistributing`,
        suggestedOwner: 'Engineering Manager' });
    if (orphans > 0)
      acts.push({ type: 'info', icon: 'question', status: 'open',
        title: `Link ${orphans} orphan item${orphans > 1 ? 's' : ''} to epics`,
        detail: 'Items without epic reduce scope traceability and epic completion accuracy',
        suggestedOwner: 'Product Owner' });
    const epics = (metrics?.epics as any[]) ?? [];
    const critEpics = epics.filter((e: any) => (e.critical ?? 0) > 0);
    if (critEpics.length)
      acts.push({ type: 'warning', icon: 'alert', status: 'open',
        title: `${critEpics.length} epic${critEpics.length > 1 ? 's' : ''} in critical state`,
        detail: `${critEpics[0].epic || 'Top epic'}: ${critEpics[0].completion ?? 0}% complete — needs attention`,
        suggestedOwner: 'Engineering Manager' });
    const rels = metrics?.relations as any;
    if (rels?.blockedItems?.length)
      acts.push({ type: 'critical', icon: 'link', status: 'open',
        title: `${rels.blockedItems.length} item${rels.blockedItems.length > 1 ? 's' : ''} explicitly blocked`,
        detail: `${rels.blockedItems[0].key} is blocked by ${rels.blockedItems[0].blockedBy}`,
        suggestedOwner: 'Scrum Master / Delivery Manager' });
    return acts;
  }, [flowItems, metrics]);

  const filtered = useMemo(() =>
    priorityFilter === 'all' ? actions : actions.filter(a => a.type === priorityFilter),
    [actions, priorityFilter]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  return (
    <>
      <StickyToolbar>
        <FilterChip label="All"      active={priorityFilter === 'all'}      onClick={() => setPriorityFilter('all')} />
        <FilterChip label="Critical" active={priorityFilter === 'critical'} onClick={() => setPriorityFilter('critical')} dot={actions.some(a => a.type === 'critical')} />
        <FilterChip label="Warning"  active={priorityFilter === 'warning'}  onClick={() => setPriorityFilter('warning')} />
        <FilterChip label="Info"     active={priorityFilter === 'info'}     onClick={() => setPriorityFilter('info')} />
        <FilterChip label="Clear"    active={false}                         onClick={() => setPriorityFilter('all')} />
        <ToolbarSpacer />
      </StickyToolbar>

      <PageHeader
        id="tour-recommendations"
        title="Smart Actions"
        badge={`${actions.length} recommendations`}
        subtitle="Actionable recommendations to improve delivery health."
      />

      <div className={shellStyles.pageBody}>

        {/* ── Summary count chips ── */}
        <div className={styles.countStrip}>
          {(['critical', 'warning', 'info'] as const).map(type => {
            const count = actions.filter(a => a.type === type).length;
            if (!count) return null;
            const tok = TYPE_TOKENS[type];
            return (
              // --count-bg / --count-border / --count-color are data-driven (action type).
              <div key={type} className={styles.countChip}
                style={{ '--count-bg': tok.bg, '--count-border': tok.border, '--count-color': tok.color } as CSSProperties}>
                <p className={styles.countLabel}>{type}</p>
                <p className={styles.countValue}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* ── Action list ── */}
        {filtered.length > 0 ? (
          <div className={styles.actionList}>
            {filtered.map((action, i) => {
              const tok = TYPE_TOKENS[action.type] ?? TYPE_TOKENS.info;
              return (
                // --action-accent / --badge-bg / --badge-color are data-driven (action.type).
                <div key={i} className={styles.actionCard}
                  style={{ '--action-accent': tok.color } as CSSProperties}>
                  <span className={styles.actionIcon}><SvgIcon name={action.icon} size={18} /></span>
                  <div className={styles.actionBody}>
                    <div className={styles.actionHeader}>
                      <span className={styles.actionTypeBadge}
                        style={{ '--badge-bg': tok.bg, '--badge-color': tok.color } as CSSProperties}>
                        {action.type}
                      </span>
                      <span className={styles.actionTitle}>{action.title}</span>
                    </div>
                    <p className={styles.actionDetail}>{action.detail}</p>
                    <div className={styles.actionOwnerRow}>
                      <span className={styles.actionOwnerKey}>Suggested owner:</span>
                      <span className={styles.actionOwnerValue}>{action.suggestedOwner}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={shellStyles.emptySection}>
            <div className={shellStyles.emptySectionIcon}><SvgIcon name="checkCircle" size={32} /></div>
            No {priorityFilter !== 'all' ? priorityFilter + ' ' : ''}actions at this time.
          </div>
        )}

      </div>
    </>
  );
}
