// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './page.module.scss';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

type ActionType = { type: string; icon: string; title: string; detail: string; suggestedOwner: string };

// Data-driven color tokens for each action type.
// EXCEPTION (CLAUDE.md Rule 1): these are set as CSS custom properties in JSX.
const TYPE_TOKENS: Record<string, { bg: string; border: string; color: string }> = {
  critical: { bg: 'var(--color-danger-soft)',  border: 'var(--color-danger-border)',  color: 'var(--color-danger-strong)' },
  warning:  { bg: 'var(--color-warning-soft)', border: 'var(--color-warning-border)', color: 'var(--color-warning)'       },
  info:     { bg: 'var(--color-primary-soft)', border: 'var(--color-primary-border)', color: 'var(--color-primary)'       },
};

// Same pattern as TYPE_TOKENS above, for the summary count strip.
const SUMMARY_TOKENS = {
  blockers: { bg: 'var(--color-danger-soft)',  border: 'var(--color-danger-border)',  color: 'var(--color-danger-strong)' },
  overdue:  { bg: 'var(--color-warning-soft)', border: 'var(--color-warning-border)', color: 'var(--color-warning)'       },
  orphans:  { bg: 'rgb(8 145 178 / 8%)',       border: 'rgb(8 145 178 / 25%)',        color: 'var(--chart-series-6)'      },
  critical: { bg: 'rgb(124 58 237 / 8%)',      border: 'rgb(124 58 237 / 25%)',       color: 'var(--dc-purple)'           },
};

export default function PriorityAttentionPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboardMetrics();
  const [quickFilter, setQuickFilter] = useState<'all' | 'blocked' | 'overdue' | 'orphans'>('all');

  useEffect(() => {
    if (!loading && !metrics) router.replace('/');
  }, [loading, metrics, router]);

  const flowItems: FlowItem[] = useMemo(() => {
    const raw = metrics?.flow?.items ?? [];
    const seen = new Set<string>();
    return raw.filter(i => { if (seen.has(i.key)) return false; seen.add(i.key); return true; });
  }, [metrics?.flow?.items]);

  const blockers = useMemo(() => flowItems.filter(i => norm(i.reason).includes('block')), [flowItems]);
  const overdueItems = useMemo(() => flowItems.filter(i => Number(i.ageDays) > 10 && !DONE_STATUSES.includes(norm(i.status))), [flowItems]);
  const orphans = useMemo(() => flowItems.filter(i => i.isOrphan), [flowItems]);
  const criticalItems = useMemo(() => flowItems.filter(i => i.health === 'critical'), [flowItems]);

  const actions: ActionType[] = useMemo(() => {
    if (!metrics) return [];
    const acts: ActionType[] = [];
    const critBlockers = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('block'));
    if (critBlockers.length)
      acts.push({ type: 'critical', icon: 'priorityBlocker',
        title: `Unblock ${critBlockers.length} critical item${critBlockers.length > 1 ? 's' : ''}`,
        detail: `${critBlockers[0].key}: ${(critBlockers[0].summary || (critBlockers[0].reason ?? '')).slice(0, 80)}`,
        suggestedOwner: 'Scrum Master / Delivery Manager' });
    const staleActive = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('in progress over 14'));
    if (staleActive.length)
      acts.push({ type: 'critical', icon: 'clock',
        title: `${staleActive.length} item${staleActive.length > 1 ? 's' : ''} stalled in progress`,
        detail: `${staleActive[0].key} has been active for ${Math.round((staleActive[0] as any).activeAgeDays || 0)} days`,
        suggestedOwner: 'Engineering Manager' });
    const capacity = ((metrics?.capacity || []) as any[]);
    const overloaded = capacity.filter((c: any) => c.loadShare > 35);
    if (overloaded.length && capacity.length > 2)
      acts.push({ type: 'warning', icon: 'scales',
        title: 'Team capacity imbalance detected',
        detail: `${overloaded[0].assignee} carries ${overloaded[0].loadShare}% — consider redistributing`,
        suggestedOwner: 'Engineering Manager' });
    if (orphans.length > 0)
      acts.push({ type: 'info', icon: 'question',
        title: `Link ${orphans.length} orphan item${orphans.length > 1 ? 's' : ''} to epics`,
        detail: 'Items without epic reduce scope traceability and epic completion accuracy',
        suggestedOwner: 'Product Owner' });
    const epics = (metrics?.epics as any[]) ?? [];
    const critEpics = epics.filter((e: any) => (e.critical ?? 0) > 0);
    if (critEpics.length)
      acts.push({ type: 'warning', icon: 'alert',
        title: `${critEpics.length} epic${critEpics.length > 1 ? 's' : ''} in critical state`,
        detail: `${critEpics[0].epic || 'Top epic'}: ${critEpics[0].completion ?? 0}% complete — needs attention`,
        suggestedOwner: 'Engineering Manager' });
    const rels = metrics?.relations as any;
    if (rels?.blockedItems?.length)
      acts.push({ type: 'critical', icon: 'link',
        title: `${rels.blockedItems.length} item${rels.blockedItems.length > 1 ? 's' : ''} explicitly blocked`,
        detail: `${rels.blockedItems[0].key} is blocked by ${rels.blockedItems[0].blockedBy}`,
        suggestedOwner: 'Scrum Master / Delivery Manager' });
    return acts;
  }, [flowItems, metrics, orphans.length]);

  const exportCSV = () => {
    const rows = quickFilter === 'blocked' ? blockers
      : quickFilter === 'overdue' ? overdueItems
      : quickFilter === 'orphans' ? orphans
      : [...new Set([...blockers, ...overdueItems.slice(0, 20)])];
    const cols = ['key', 'summary', 'status', 'assignee', 'health', 'reason'];
    const csv = buildSafeCsv([cols, ...rows.map(r => cols.map(c => (r as any)[c]))], { alwaysQuote: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'priority-attention.csv'; a.click();
  };

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const totalAttention = blockers.length + overdueItems.length;

  return (
    <>
      {/* ── Sticky toolbar ── */}
      <StickyToolbar>
        <FilterChip label="All" active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
        <FilterChip label={`Blocked (${blockers.length})`} active={quickFilter === 'blocked'} onClick={() => setQuickFilter('blocked')} dot={blockers.length > 0} />
        <FilterChip label={`Overdue (${overdueItems.length})`} active={quickFilter === 'overdue'} onClick={() => setQuickFilter('overdue')} />
        <FilterChip label={`Orphans (${orphans.length})`} active={quickFilter === 'orphans'} onClick={() => setQuickFilter('orphans')} />
        <FilterChip label="Clear" active={false} onClick={() => setQuickFilter('all')} />
        <ToolbarSpacer />
        <ToolbarButton label="Export" onClick={exportCSV} />

      </StickyToolbar>

      {/* ── Page header ── */}
      <PageHeader
        id="tour-header-priority-attention"
        title="Priority Attention"
        badge={`${totalAttention.toLocaleString()} items`}
        subtitle="Items requiring immediate delivery intervention, plus recommended actions."
      />

      <div className={styles.page}>

        {/* ── Summary row ── */}
        <div id="tour-section-priority-attention-1" className={styles.countStrip}>
          {[
            { label: 'Blockers', value: blockers.length, tok: SUMMARY_TOKENS.blockers },
            { label: 'Overdue', value: overdueItems.length, tok: SUMMARY_TOKENS.overdue },
            { label: 'Orphans', value: orphans.length, tok: SUMMARY_TOKENS.orphans },
            { label: 'Critical', value: criticalItems.length, tok: SUMMARY_TOKENS.critical },
          ].map(({ label, value, tok }) => (
            // --count-bg / --count-border / --count-color are data-driven
            // token references (never raw hex) — see TYPE_TOKENS above.
            // Set on the chip so --count-color inherits into .countValue.
            <div
              key={label}
              className={styles.countChip}
              style={{ '--count-bg': tok.bg, '--count-border': tok.border, '--count-color': tok.color } as CSSProperties}
            >
              <p className={styles.countLabel}>{label}</p>
              <p className={styles.countValue}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Smart Actions ── */}
        {actions.length > 0 && (
          <SectionCard title={`Smart Actions · ${actions.length} recommendation${actions.length > 1 ? 's' : ''}`}>
            <div id="tour-section-priority-attention-actions" className={styles.actionList}>
              {actions.map((action, i) => {
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
          </SectionCard>
        )}

        {/* ── Blockers panel ── */}
        {(quickFilter === 'all' || quickFilter === 'blocked') && blockers.length > 0 && (
          <SectionCard title={`🚫 Blockers · ${blockers.length} items`}>
            <AttentionTable items={blockers} showSprint headerId="tour-section-priority-attention-2" />
          </SectionCard>
        )}

        {/* ── Overdue panel ── */}
        {(quickFilter === 'all' || quickFilter === 'overdue') && overdueItems.length > 0 && (
          <SectionCard title={`⏰ Overdue · ${overdueItems.length} items`}>
            <AttentionTable items={overdueItems} showAge />
          </SectionCard>
        )}

        {/* ── Orphans panel ── */}
        {(quickFilter === 'all' || quickFilter === 'orphans') && orphans.length > 0 && (
          <SectionCard title={`👻 Orphans · ${orphans.length} items`}>
            <AttentionTable items={orphans.slice(0, 40)} showAssignee />
          </SectionCard>
        )}

        {totalAttention === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✅</div>
            No priority items require attention.
          </div>
        )}
      </div>
    </>
  );
}

function AttentionTable({ items, showAge, showAssignee, showSprint, headerId }: {
  items: FlowItem[]; showAge?: boolean; showAssignee?: boolean; showSprint?: boolean; headerId?: string;
}) {
  const shown = items.slice(0, 50);
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead id={headerId}>
          <tr className={styles.tableHeadRow}>
            {['Key', 'Summary', 'Status', showSprint && 'Sprint', showAssignee && 'Assignee', showAge && 'Age (d)', 'Health'].filter(Boolean).map(h => (
              <th key={h as string} className={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((item, i) => {
            const health = ['critical', 'warning'].includes(item.health) ? item.health : undefined;
            return (
              <tr key={item.key ?? i} className={styles.tableRow}>
                <td className={styles.cellKey}>{item.key}</td>
                <td className={styles.cellSummary}>
                  <span className={styles.ellipsisText}>{item.summary}</span>
                </td>
                <td className={styles.cellPlain}>{item.status}</td>
                {showSprint && <td className={styles.cellPlain}>{item.sprint || '—'}</td>}
                {showAssignee && <td className={styles.cellPlain}>{item.assignee ?? '—'}</td>}
                {showAge && <td className={styles.cellAge} data-severe={Number(item.ageDays) > 30 || undefined}>{item.ageDays ?? '—'}</td>}
                <td className={styles.cellHealth}>
                  <span className={styles.healthBadge} data-health={health}>
                    {item.health ?? 'good'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length > 50 && (
        <p className={styles.moreNote}>
          Showing 50 of {items.length} items
        </p>
      )}
    </div>
  );
}
