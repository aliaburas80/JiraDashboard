// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, useCallback, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';
import styles from './page.module.scss';

// STYLE-03 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token mapping notes. No behavior change.

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const ACTIVE_STATUSES = ['in progress', 'code review', 'qa', 'testing'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
const matchText = (val: unknown, q: string) => !q || norm(val).includes(norm(q));

// CP3-002/CP3-004-adjacent: this badge only reflects the pre-computed
// per-item `health` classification already on FlowItem — no new business
// logic here, just how it renders. HEALTH_COLORS removed in favor of a
// data-health attribute + page.module.scss (CLAUDE.md §28: business logic
// must not return colors).
function HealthBadge({ value }: { value?: string }) {
  const v = norm(value);
  const health = ['critical', 'warning', 'good'].includes(v) ? v : undefined;
  return (
    <span className={styles.healthBadge} data-health={health}>
      {value || '—'}
    </span>
  );
}

export default function FlowHealthPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboardMetrics();

  // ── filter state ──
  const [keyFilter,      setKeyFilter]      = useState('');
  const [summaryFilter,  setSummaryFilter]  = useState('');
  const [reasonFilter,   setReasonFilter]   = useState('');
  const [labelFilter,    setLabelFilter]    = useState('');
  const [leadMax,        setLeadMax]        = useState('');
  const [cycleMax,       setCycleMax]       = useState('');
  const [ageMax,         setAgeMax]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [sprintFilter,   setSprintFilter]   = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [healthFilter,   setHealthFilter]   = useState('all');
  const [typeFilter,     setTypeFilter]     = useState('all');
  const [quickFilter,    setQuickFilter]    = useState<'all' | 'critical' | 'warning' | 'orphan'>('all');
  const [visibleCount,   setVisibleCount]   = useState(100);

  useEffect(() => {
    if (!loading && !metrics) router.replace('/');
  }, [loading, metrics, router]);

  const flowItems: FlowItem[] = useMemo(() => {
    const raw = metrics?.flow?.items ?? [];
    const seen = new Set<string>();
    return raw.filter(i => { if (seen.has(i.key)) return false; seen.add(i.key); return true; });
  }, [metrics?.flow?.items]);

  const statusOptions   = useMemo(() => [...new Set(flowItems.map(i => i.status).filter(Boolean))].sort() as string[], [flowItems]);
  const sprintOptions   = useMemo(() => [...new Set(flowItems.map(i => i.sprint).filter(Boolean))].sort() as string[], [flowItems]);
  const assigneeOptions = useMemo(() => [...new Set(flowItems.map(i => i.assignee).filter(Boolean))].sort() as string[], [flowItems]);
  const typeOptions     = useMemo(() => [...new Set(flowItems.map(i => i.type).filter(Boolean))].sort() as string[], [flowItems]);

  const filtered = useMemo(() => flowItems.filter(i => {
    if (!matchText(i.key, keyFilter)) return false;
    if (!matchText(i.summary, summaryFilter)) return false;
    if (!matchText(i.reason, reasonFilter)) return false;
    if (labelFilter && !norm((i as any).labels).includes(norm(labelFilter))) return false;
    if (statusFilter !== 'all' && norm(i.status) !== norm(statusFilter)) return false;
    if (sprintFilter !== 'all' && norm(i.sprint) !== norm(sprintFilter)) return false;
    if (assigneeFilter !== 'all' && norm(i.assignee) !== norm(assigneeFilter)) return false;
    if (healthFilter !== 'all' && norm(i.health) !== norm(healthFilter)) return false;
    if (typeFilter !== 'all' && norm(i.type) !== norm(typeFilter)) return false;
    if (leadMax && Number(i.leadTimeDays) > Number(leadMax)) return false;
    if (cycleMax && Number(i.cycleTimeDays) > Number(cycleMax)) return false;
    if (ageMax && Number(i.ageDays) > Number(ageMax)) return false;
    if (quickFilter === 'critical' && norm(i.health) !== 'critical') return false;
    if (quickFilter === 'warning' && norm(i.health) !== 'warning') return false;
    if (quickFilter === 'orphan' && !i.isOrphan) return false;
    return true;
  }), [flowItems, keyFilter, summaryFilter, reasonFilter, labelFilter, statusFilter, sprintFilter, assigneeFilter, healthFilter, typeFilter, leadMax, cycleMax, ageMax, quickFilter]);

  const statusDist = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(i => { const s = i.status || 'Unknown'; map.set(s, (map.get(s) ?? 0) + 1); });
    return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filtered]);

  const statusMax = Math.max(...statusDist.map(r => r.count), 1);

  const resetAll = useCallback(() => {
    setKeyFilter(''); setSummaryFilter(''); setReasonFilter(''); setLabelFilter('');
    setLeadMax(''); setCycleMax(''); setAgeMax('');
    setStatusFilter('all'); setSprintFilter('all'); setAssigneeFilter('all'); setHealthFilter('all'); setTypeFilter('all');
    setQuickFilter('all'); setVisibleCount(100);
  }, []);

  const exportCsv = useCallback(() => {
    const cols = ['Key', 'Summary', 'Type', 'Status', 'Sprint', 'Epic/Parent', 'Assignee', 'Labels', 'Lead (d)', 'Cycle (d)', 'Open Age (d)', 'Health', 'Reason'];
    const rows = filtered.map(i => [
      i.key, i.summary, i.type ?? '', i.status, i.sprint ?? '', i.epic ?? i.parent ?? '',
      i.assignee ?? '', (i as any).labels ?? '', i.leadTimeDays ?? '', i.cycleTimeDays ?? '',
      i.ageDays ?? '', i.health ?? '', i.reason ?? '',
    ]);
    const csv = buildSafeCsv([cols, ...rows], { alwaysQuote: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'flow-health.csv';
    a.click();
  }, [filtered]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const orphanCount = filtered.filter(i => i.isOrphan).length;
  const visible = filtered.slice(0, visibleCount);

  const textFilters = [
    { label: 'Key', value: keyFilter, set: setKeyFilter, placeholder: 'AJ-24' },
    { label: 'Story / Task', value: summaryFilter, set: setSummaryFilter, placeholder: 'Summary text' },
    { label: 'Reason', value: reasonFilter, set: setReasonFilter, placeholder: 'Blocked, overdue…' },
    { label: 'Labels', value: labelFilter, set: setLabelFilter, placeholder: 'bug-fix, mobile…' },
    { label: 'Lead ≤ (days)', value: leadMax, set: setLeadMax, placeholder: '30', type: 'number' },
    { label: 'Cycle ≤ (days)', value: cycleMax, set: setCycleMax, placeholder: '14', type: 'number' },
    { label: 'Open Age ≤ (days)', value: ageMax, set: setAgeMax, placeholder: '10', type: 'number' },
  ];

  const selectFilters = [
    { label: 'Issue Type', value: typeFilter, set: setTypeFilter, opts: typeOptions, allLabel: 'All types' },
    { label: 'Status', value: statusFilter, set: setStatusFilter, opts: statusOptions, allLabel: 'All statuses' },
    { label: 'Sprint', value: sprintFilter, set: setSprintFilter, opts: sprintOptions, allLabel: 'All sprints' },
    { label: 'Assignee', value: assigneeFilter, set: setAssigneeFilter, opts: assigneeOptions, allLabel: 'All assignees' },
    { label: 'Health', value: healthFilter, set: setHealthFilter, opts: ['critical', 'warning', 'good'], allLabel: 'All health' },
  ];

  const columns = [
    { label: 'Key', className: styles.colKey },
    { label: 'Summary' },
    { label: 'Type', className: styles.colType },
    { label: 'Status', className: styles.colStatus },
    { label: 'Sprint', className: styles.colSprint },
    { label: 'Epic / Parent', className: styles.colEpic },
    { label: 'Assignee', className: styles.colAssignee },
    { label: 'Lead', className: styles.colMetric },
    { label: 'Cycle', className: styles.colMetric },
    { label: 'Age', className: styles.colMetric },
    { label: 'Health', className: styles.colMetric },
    { label: 'Reason' },
  ];

  return (
    <>
      <StickyToolbar>
        <FilterChip label="All"      active={quickFilter === 'all'}      onClick={() => { setQuickFilter('all');      setVisibleCount(100); }} />
        <FilterChip label="Critical" active={quickFilter === 'critical'} onClick={() => { setQuickFilter('critical'); setVisibleCount(100); }} dot={flowItems.some(i => norm(i.health) === 'critical')} />
        <FilterChip label="Warning"  active={quickFilter === 'warning'}  onClick={() => { setQuickFilter('warning');  setVisibleCount(100); }} />
        <FilterChip label="Orphans"  active={quickFilter === 'orphan'}   onClick={() => { setQuickFilter('orphan');   setVisibleCount(100); }} />
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        id="tour-header-dashboard-flow-health"
        title="Flow Health Table"
        badge={`${filtered.length} of ${flowItems.length} items`}
        subtitle="Filter, inspect, and export every item in this delivery."
      />

      <div className={styles.page}>

        {/* ── Filters ── */}
        <div className={styles.filterPanel}>
          <div className={styles.filterGridText}>
            {textFilters.map(({ label, value, set, placeholder, type }) => (
              <label key={label} className={styles.filterField}>
                <span className={styles.filterLabel}>{label}</span>
                <input
                  type={type ?? 'search'}
                  value={value}
                  placeholder={placeholder}
                  onChange={e => { set(e.target.value); setVisibleCount(100); }}
                  className={styles.filterControl}
                />
              </label>
            ))}
          </div>
          <div className={styles.filterGridSelect}>
            {selectFilters.map(({ label, value, set, opts, allLabel }) => (
              <label key={label} className={styles.filterField}>
                <span className={styles.filterLabel}>{label}</span>
                <select value={value} onChange={e => { set(e.target.value); setVisibleCount(100); }} className={styles.filterControl}>
                  <option value="all">{allLabel}</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>

          {/* ── Action row ── */}
          <div id="tour-section-dashboard-flow-health-1" className={styles.actionRow}>
            <button type="button" onClick={resetAll} className={styles.btnReset}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Reset filters
            </button>
            <button type="button" onClick={exportCsv} className={styles.btnExport}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
            <span className={styles.resultCount}>
              {filtered.length.toLocaleString()} of {flowItems.length.toLocaleString()} items
            </span>
          </div>
        </div>

        {/* ── Status distribution of filtered set ── */}
        {statusDist.length > 0 && (
          <SectionCard title="Status Distribution (filtered)">
            <div className={styles.statusList}>
              {statusDist.map((r, i) => {
                const isDone = DONE_STATUSES.includes(norm(r.name));
                const isActive = ACTIVE_STATUSES.includes(norm(r.name));
                const status = isDone ? 'done' : isActive ? 'active' : undefined;
                // EXCEPTION (CLAUDE.md Rule 1): fill width and stagger delay
                // are computed from the current filtered dataset — no color
                // travels through this variable, only geometry/timing.
                const barVars: CSSVariableProperties = {
                  '--bar-width': `${(r.count / statusMax) * 100}%`,
                  '--bar-delay': `${i * 50}ms`,
                };
                return (
                  <div key={r.name} className={styles.statusRow}>
                    <span className={styles.statusName}>{r.name}</span>
                    <div className={styles.statusBarTrack}>
                      <div className={styles.statusBarFill} data-status={status} style={barVars} />
                    </div>
                    <strong className={styles.statusCount} data-status={status}>{r.count}</strong>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ── Summary line ── */}
        <div className={styles.summaryLine}>
          Showing <strong className={styles.summaryStrong}>{visible.length}</strong> of <strong className={styles.summaryStrong}>{filtered.length}</strong> matching items from <strong className={styles.summaryStrong}>{flowItems.length}</strong> total.
          {orphanCount > 0 && <span className={styles.orphanNote}>{orphanCount} orphan items</span>}
        </div>

        {/* ── Items table ── */}
        <div id="tour-section-dashboard-flow-health-2" className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.dataTable}>
              <thead>
                <tr className={styles.tableHeadRow}>
                  {columns.map(col => (
                    <th key={col.label} className={clsx(styles.th, col.className)}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className={styles.emptyCell}>
                      No items match the selected filters.
                    </td>
                  </tr>
                ) : visible.map((item, i) => {
                  const leadSeverity = Number(item.leadTimeDays) > 14 ? 'warning' : undefined;
                  const cycleSeverity = Number(item.cycleTimeDays) > 14 ? 'warning' : undefined;
                  const ageSeverity = Number(item.ageDays) > 10 ? 'critical' : undefined;
                  return (
                    <tr key={item.key ?? i} className={styles.tableRow} data-orphan={item.isOrphan || undefined}>
                      <td className={styles.cellKey}>{item.key}</td>
                      <td className={styles.cellSummary}>
                        <span className={styles.ellipsisText} title={item.summary}>{item.summary}</span>
                      </td>
                      <td className={styles.cellType}>
                        <span className={styles.typeBadge}>{item.type || '—'}</span>
                      </td>
                      <td className={styles.cellStatus}>{item.status}</td>
                      <td className={styles.cellSprint}>{item.sprint ?? '—'}</td>
                      <td className={styles.cellEpic} data-orphan={item.isOrphan || undefined}>
                        {item.epic ?? item.parent ?? <span className={styles.orphanLabel}>Orphan</span>}
                      </td>
                      <td className={styles.cellAssignee}>{item.assignee ?? '—'}</td>
                      <td className={styles.cellMetric} data-severity={leadSeverity}>
                        {item.leadTimeDays != null ? `${item.leadTimeDays}d` : '—'}
                      </td>
                      <td className={styles.cellMetric} data-severity={cycleSeverity}>
                        {item.cycleTimeDays != null ? `${item.cycleTimeDays}d` : '—'}
                      </td>
                      <td className={styles.cellMetric} data-severity={ageSeverity}>
                        {item.ageDays != null ? `${item.ageDays}d` : '—'}
                      </td>
                      <td className={styles.cellHealth}><HealthBadge value={item.health} /></td>
                      <td className={styles.cellReason}>
                        <span className={styles.ellipsisText} title={item.reason}>{item.reason || '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > visibleCount && (
            <div className={styles.loadMoreWrap}>
              <button type="button" onClick={() => setVisibleCount(c => c + 100)} className={styles.btnLoadMore}>
                Show {Math.min(100, filtered.length - visibleCount)} more
                <span className={styles.loadMoreCount}>— {filtered.length - visibleCount} remaining</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
