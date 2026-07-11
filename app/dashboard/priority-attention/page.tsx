// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
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

export default function PriorityAttentionPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState<'all' | 'blocked' | 'overdue' | 'orphans'>('all');

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

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Summary row ── */}
        <div id="tour-section-priority-attention-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Blockers', value: blockers.length, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
            { label: 'Overdue', value: overdueItems.length, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
            { label: 'Orphans', value: orphans.length, color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
            { label: 'Critical', value: criticalItems.length, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, margin: 0 }}>{value}</p>
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
            <AttentionTable items={blockers} headerId="tour-section-priority-attention-2" />
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
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            No priority items require attention.
          </div>
        )}
      </div>
    </>
  );
}

function AttentionTable({ items, showAge, showAssignee, headerId }: {
  items: FlowItem[]; showAge?: boolean; showAssignee?: boolean; headerId?: string;
}) {
  const shown = items.slice(0, 50);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <thead id={headerId}>
          <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
            {['Key', 'Summary', 'Status', showAssignee && 'Assignee', showAge && 'Age (d)', 'Health'].filter(Boolean).map(h => (
              <th key={h as string} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((item, i) => (
            <tr key={item.key ?? i} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#2563EB', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.key}</td>
              <td style={{ padding: '7px 10px', color: '#334155', maxWidth: 300 }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</span>
              </td>
              <td style={{ padding: '7px 10px', color: '#64748B', whiteSpace: 'nowrap' }}>{item.status}</td>
              {showAssignee && <td style={{ padding: '7px 10px', color: '#64748B', whiteSpace: 'nowrap' }}>{item.assignee ?? '—'}</td>}
              {showAge && <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: Number(item.ageDays) > 30 ? '#DC2626' : '#D97706', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.ageDays ?? '—'}</td>}
              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  background: item.health === 'critical' ? '#FEF2F2' : item.health === 'warning' ? '#FFFBEB' : '#F0FDF4',
                  color: item.health === 'critical' ? '#DC2626' : item.health === 'warning' ? '#D97706' : '#059669',
                }}>
                  {item.health ?? 'good'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length > 50 && (
        <p style={{ fontSize: 11, color: '#94A3B8', padding: '8px 10px' }}>
          Showing 50 of {items.length} items
        </p>
      )}
    </div>
  );
}
