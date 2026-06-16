'use client';
import { CSSProperties, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';
import styles from './page.module.scss';

// ── Helpers ───────────────────────────────────────────────────────────────────

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

const DONE_SET = new Set(['done', 'closed', 'resolved', 'complete', 'completed']);

function statusCat(status: string): 'done' | 'in-progress' | 'blocked' | 'review' | 'todo' {
  const s = norm(status);
  if (DONE_SET.has(s) || /done|resolved|complete|closed/.test(s)) return 'done';
  if (/progress|doing|active|started|working/.test(s)) return 'in-progress';
  if (/block|impede/.test(s)) return 'blocked';
  if (/review|qa|test|stag/.test(s)) return 'review';
  return 'todo';
}

// ── Type icon ─────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, { fill: string; letter: string }> = {
  bug:         { fill: '#F87171', letter: 'B' },
  story:       { fill: '#4ade80', letter: 'S' },
  task:        { fill: '#60A5FA', letter: 'T' },
  epic:        { fill: '#A78BFA', letter: 'E' },
  'sub-task':  { fill: '#93c5fd', letter: '↘' },
  feature:     { fill: '#FB923C', letter: 'F' },
  improvement: { fill: '#22D3EE', letter: 'I' },
  spike:       { fill: '#F472B6', letter: 'R' },
  'test case': { fill: '#FACC15', letter: 'Q' },
};

function resolveTypeKey(type: string): string {
  const t = norm(type);
  if (/bug|defect/.test(t))          return 'bug';
  if (/story|user.story/.test(t))    return 'story';
  if (/\bepic\b/.test(t))            return 'epic';
  if (/sub.task|subtask/.test(t))    return 'sub-task';
  if (/feature/.test(t))             return 'feature';
  if (/improve|enhance/.test(t))     return 'improvement';
  if (/spike|research/.test(t))      return 'spike';
  if (/test.case/.test(t))           return 'test case';
  if (/task/.test(t))                return 'task';
  return 'task';
}

function TypeIcon({ type }: { type: string }) {
  const key = resolveTypeKey(type);
  const c = TYPE_CFG[key] ?? TYPE_CFG.task;
  return (
    // fill/textAnchor/fontSize/fontWeight are SVG presentation attributes — not style props
    <svg width="16" height="16" viewBox="0 0 16 16" className={styles.typeIcon} aria-hidden="true">
      <rect width="16" height="16" rx="3" fill={c.fill} />
      <text x="8" y="11.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#060606">
        {c.letter}
      </text>
    </svg>
  );
}

// ── Priority ──────────────────────────────────────────────────────────────────

const PRIO_CFG: Array<[RegExp, { key: string; icon: string }]> = [
  [/critical|highest/, { key: 'critical', icon: '⬆' }],
  [/high/,             { key: 'high',     icon: '↑'  }],
  [/medium|normal/,    { key: 'medium',   icon: '→'  }],
  [/\blow\b/,          { key: 'low',      icon: '↓'  }],
  [/lowest|minor/,     { key: 'lowest',   icon: '⬇'  }],
];

function prioMeta(priority: string): { key: string; icon: string } {
  const p = norm(priority);
  for (const [re, meta] of PRIO_CFG) {
    if (re.test(p)) return meta;
  }
  return { key: 'low', icon: '—' };
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function initials(name: string): string {
  if (!name || name === '—') return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function WorkExplorerPage() {
  const router = useRouter();
  const [metrics, setMetrics]         = useState<DashboardMetrics | null>(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [statusFilter, setStatus]     = useState('all');
  const [prioFilter, setPrio]         = useState('all');
  const [healthFilter, setHealth]     = useState('all');
  const [selected, setSelected]       = useState<FlowItem | null>(null);
  const [page, setPage]               = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadMetricsWithSource()
      .then(r => {
        if (cancelled) return;
        const data = r.metrics as DashboardMetrics | null;
        if (!data) { router.replace('/'); return; }
        setMetrics(data);
      })
      .catch(() => router.replace('/'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  const items = useMemo(() => metrics?.flow?.items ?? [], [metrics]);

  const types    = useMemo(() => ['all', ...new Set(items.map(i => norm(i.type)).filter(Boolean))].sort(), [items]);
  const statuses = useMemo(() => ['all', ...new Set(items.map(i => norm(i.status)).filter(Boolean))].sort(), [items]);
  const prios    = useMemo(() => ['all', ...new Set(items.map(i => norm(i.priority ?? '')).filter(Boolean))].sort(), [items]);

  const stats = useMemo(() => {
    const total   = items.length;
    const done    = items.filter(i => DONE_SET.has(norm(i.status))).length;
    const inProg  = items.filter(i => statusCat(i.status) === 'in-progress').length;
    const atRisk  = items.filter(i => i.health === 'critical').length;
    const ages    = items.map(i => Number(i.ageDays) || 0).filter(a => a > 0);
    const avgAge  = ages.length > 0 ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : 0;
    return { total, done, donePct: total > 0 ? Math.round(done / total * 100) : 0, inProg, atRisk, avgAge };
  }, [items]);

  const filtered = useMemo(() => {
    const q = norm(search);
    return items.filter(i => {
      if (typeFilter   !== 'all' && norm(i.type)        !== typeFilter)   return false;
      if (statusFilter !== 'all' && norm(i.status)      !== statusFilter) return false;
      if (prioFilter   !== 'all' && norm(i.priority??'') !== prioFilter)  return false;
      if (healthFilter !== 'all' && i.health            !== healthFilter) return false;
      if (!q) return true;
      return (
        norm(i.key).includes(q) || norm(i.summary).includes(q) ||
        norm(i.epic).includes(q) || norm(i.assignee).includes(q) ||
        norm(i.sprint ?? '').includes(q) || norm(i.project ?? '').includes(q)
      );
    });
  }, [items, search, typeFilter, statusFilter, prioFilter, healthFilter]);

  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function resetPage() { setPage(0); setSelected(null); }

  function clearFilters() {
    setSearch(''); setTypeFilter('all'); setStatus('all');
    setPrio('all'); setHealth('all'); setPage(0); setSelected(null);
  }

  const hasFilter = !!(search || typeFilter !== 'all' || statusFilter !== 'all' || prioFilter !== 'all' || healthFilter !== 'all');

  const pageWindow = useMemo(() => {
    const half  = 2;
    const start = Math.max(0, Math.min(page - half, totalPages - 2 * half - 1));
    const end   = Math.min(totalPages - 1, start + 2 * half);
    const nums: number[] = [];
    for (let n = start; n <= end; n++) nums.push(n);
    return nums;
  }, [page, totalPages]);

  if (loading) return <AppShell showNav><LoadingState message="Loading work explorer…" /></AppShell>;
  if (!metrics) return null;

  const relatedItems = selected
    ? items.filter(i => i.epic === selected.epic && i.key !== selected.key).slice(0, 8)
    : [];
  const children = selected
    ? items.filter(i => i.parent === selected.key).slice(0, 10)
    : [];

  const FILTERS = [
    { label: 'Type',     value: typeFilter,   options: types,    setter: (v: string) => { setTypeFilter(v); resetPage(); } },
    { label: 'Status',   value: statusFilter, options: statuses, setter: (v: string) => { setStatus(v);     resetPage(); } },
    { label: 'Priority', value: prioFilter,   options: prios.length > 1 ? prios : [], setter: (v: string) => { setPrio(v); resetPage(); } },
    { label: 'Health',   value: healthFilter, options: ['all', 'critical', 'warning', 'good'], setter: (v: string) => { setHealth(v); resetPage(); } },
  ].filter(f => f.options.length > 1);

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Header ── */}
        <header className={styles.pageHeader}>
          <div className={styles.breadcrumb}>
            {/* Jira-style project badge — fill is SVG presentation attribute */}
            <svg width="18" height="18" viewBox="0 0 18 18" className={styles.jiraIcon} aria-hidden="true">
              <rect width="18" height="18" rx="4" fill="#FF8A4C" opacity="0.18" />
              <text x="9" y="13" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FF8A4C">J</text>
            </svg>
            <span className={styles.breadcrumbProject}>Project Backlog</span>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>Work Explorer</span>
          </div>
          <h1 className={styles.pageTitle}>Work Explorer</h1>
          <p className={styles.pageMeta}>
            Showing <strong>{filtered.length.toLocaleString()}</strong> of{' '}
            <strong>{items.length.toLocaleString()}</strong> issues — click any row to inspect
          </p>
        </header>

        {/* ── Stats strip ── */}
        {items.length > 0 && (
          <div className={styles.statsStrip} role="list" aria-label="Project summary">
            {[
              { label: 'Total Issues',   val: stats.total.toLocaleString(),   color: 'var(--dc-p1, #F2F2F2)' },
              { label: `Done (${stats.donePct}%)`, val: stats.done.toLocaleString(), color: '#4ade80' },
              { label: 'In Progress',    val: stats.inProg.toLocaleString(),  color: '#93c5fd' },
              { label: 'At Risk',        val: stats.atRisk.toLocaleString(),  color: stats.atRisk > 0 ? '#fca5a5' : 'var(--dc-p1)' },
              { label: 'Avg Age (days)', val: stats.avgAge > 0 ? String(stats.avgAge) : '—', color: stats.avgAge > 14 ? '#F59E0B' : 'var(--dc-p1)' },
            ].map(s => (
              <div key={s.label} className={styles.statChip} role="listitem">
                <div className={styles.statVal} style={{ '--stat-color': s.color } as CSSProperties}>
                  {s.val}
                </div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className={styles.toolbar} role="search">
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }}
              placeholder="Search by key, summary, epic, assignee…"
              className={styles.searchInput}
              aria-label="Search work items"
            />
          </div>

          {FILTERS.map(f => (
            <select
              key={f.label}
              value={f.value}
              onChange={e => f.setter(e.target.value)}
              className={styles.filterSelect}
              data-active={f.value !== 'all' ? 'true' : undefined}
              aria-label={`Filter by ${f.label}`}
            >
              <option value="all">All {f.label}s</option>
              {f.options.filter(o => o !== 'all').map(o => (
                <option key={o} value={o}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </option>
              ))}
            </select>
          ))}

          {hasFilter && (
            <button type="button" onClick={clearFilters} className={styles.clearBtn}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* ── Content ── */}
        <div className={styles.layout} data-panel={selected ? 'open' : 'closed'}>

          {/* ── Issue table ── */}
          <div className={styles.tableCard}>
            {pageItems.length === 0 ? (
              <div className={styles.emptyTable}>
                <div className={styles.emptyIcon}>🔍</div>
                <p className={styles.emptyTitle}>No issues match your filters</p>
                <p className={styles.emptyBody}>Try adjusting the search query or filter selections above.</p>
              </div>
            ) : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead className={styles.tableHead}>
                      <tr>
                        <th scope="col">Key</th>
                        <th scope="col" aria-label="Priority">P</th>
                        <th scope="col">Type</th>
                        <th scope="col">Summary</th>
                        <th scope="col">Status</th>
                        <th scope="col">Assignee</th>
                        <th scope="col" className={styles.right}>Age (d)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map(item => {
                        const isSelected = selected?.key === item.key;
                        const cat  = statusCat(item.status);
                        const prio = prioMeta(item.priority ?? '');
                        const age  = Number(item.ageDays ?? 0);
                        return (
                          <tr
                            key={item.key}
                            className={styles.tableRow}
                            data-selected={isSelected ? 'true' : undefined}
                            onClick={() => setSelected(isSelected ? null : item)}
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            aria-label={`${item.key}: ${item.summary}`}
                            onKeyDown={e => e.key === 'Enter' && setSelected(isSelected ? null : item)}
                          >
                            <td className={styles.keyCell}>{item.key}</td>

                            <td className={styles.prioCell}>
                              <span
                                className={styles.prioFlag}
                                data-prio={prio.key}
                                aria-label={`Priority: ${item.priority || 'unset'}`}
                              >
                                {prio.icon}
                              </span>
                            </td>

                            <td className={styles.typeCell}>
                              <span className={styles.typeBadge}>
                                <TypeIcon type={item.type ?? 'task'} />
                                {item.type ?? 'Task'}
                              </span>
                            </td>

                            <td className={styles.summaryCell}>
                              <div className={styles.summaryCellInner}>{item.summary}</div>
                            </td>

                            <td className={styles.statusCell}>
                              <span className={styles.statusLozenge} data-cat={cat}>
                                <span className={styles.statusDot} aria-hidden="true" />
                                {item.status}
                              </span>
                            </td>

                            <td className={styles.assigneeCell}>
                              <div className={styles.assigneeInner}>
                                <span className={styles.avatar} aria-hidden="true">
                                  {initials(item.assignee ?? '')}
                                </span>
                                <span className={styles.assigneeName}>{item.assignee || '—'}</span>
                              </div>
                            </td>

                            <td
                              className={styles.ageCell}
                              data-overdue={age > 30 ? 'true' : undefined}
                              data-warning={age > 14 && age <= 30 ? 'true' : undefined}
                            >
                              {age > 0 ? age : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>
                      {(page * PAGE_SIZE + 1).toLocaleString()}–
                      {Math.min((page + 1) * PAGE_SIZE, filtered.length).toLocaleString()} of{' '}
                      {filtered.length.toLocaleString()}
                    </span>
                    <div className={styles.paginationBtns}>
                      <button
                        type="button"
                        className={styles.paginationBtn}
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                      >
                        ← Prev
                      </button>
                      <div className={styles.pageNums}>
                        {pageWindow.map(n => (
                          <button
                            key={n}
                            type="button"
                            className={styles.pageNum}
                            data-current={n === page ? 'true' : undefined}
                            onClick={() => setPage(n)}
                            aria-label={`Page ${n + 1}`}
                            aria-current={n === page ? 'page' : undefined}
                          >
                            {n + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className={styles.paginationBtn}
                        disabled={page >= totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Detail panel ── */}
          {selected && (
            <aside className={styles.detailPanel} aria-label="Issue detail">

              <div className={styles.detailHeader}>
                <div className={styles.detailHeaderRow}>
                  <div className={styles.detailKeyRow}>
                    <TypeIcon type={selected.type ?? 'task'} />
                    <span className={styles.detailKey}>{selected.key}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.detailClose}
                    onClick={() => setSelected(null)}
                    aria-label="Close detail panel"
                  >
                    ×
                  </button>
                </div>
                <p className={styles.detailSummary}>{selected.summary}</p>
              </div>

              <div className={styles.detailChips}>
                <span className={styles.statusLozenge} data-cat={statusCat(selected.status)}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  {selected.status}
                </span>
                {selected.health && (
                  <DCStatusChip
                    label={selected.health}
                    tone={
                      selected.health === 'critical' ? 'critical' :
                      selected.health === 'warning'  ? 'warning'  : 'success'
                    }
                    size="sm"
                  />
                )}
                {selected.priority && (
                  <span className={styles.prioChip} data-prio={prioMeta(selected.priority).key}>
                    {prioMeta(selected.priority).icon} {selected.priority}
                  </span>
                )}
              </div>

              <div className={styles.detailBody}>

                {/* Details section */}
                <section className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Details</p>
                  {([
                    { label: 'Assignee',  value: selected.assignee  || '—' },
                    { label: 'Epic',      value: selected.epic       || '—' },
                    { label: 'Sprint',    value: selected.sprint     || '—' },
                    { label: 'Project',   value: selected.project    || '—' },
                    { label: 'Type',      value: selected.type       || '—' },
                    { label: 'Story pts', value: selected.storyPoints != null ? String(selected.storyPoints) : '—' },
                  ] as const).map(row => (
                    <div key={row.label} className={styles.detailField}>
                      <span className={styles.detailFieldLabel}>{row.label}</span>
                      <span className={styles.detailFieldValue}>{row.value}</span>
                    </div>
                  ))}
                </section>

                {/* Time section */}
                <section className={styles.detailSection}>
                  <p className={styles.detailSectionTitle}>Time</p>
                  {([
                    { label: 'Age',        value: selected.ageDays != null        ? `${selected.ageDays}d`        : '—' },
                    { label: 'Lead time',  value: selected.leadTimeDays != null   ? `${selected.leadTimeDays}d`   : '—' },
                    { label: 'Cycle time', value: selected.cycleTimeDays != null  ? `${selected.cycleTimeDays}d`  : '—' },
                  ] as const).map(row => (
                    <div key={row.label} className={styles.detailField}>
                      <span className={styles.detailFieldLabel}>{row.label}</span>
                      <span className={styles.detailFieldValue}>{row.value}</span>
                    </div>
                  ))}
                </section>

                {/* Health note */}
                {selected.reason && (
                  <div className={styles.healthNote}>
                    <p className={styles.healthNoteTitle}>⚠ Health note</p>
                    <p className={styles.healthNoteBody}>{selected.reason}</p>
                  </div>
                )}

                {/* Children */}
                {children.length > 0 && (
                  <section className={styles.detailSection}>
                    <p className={styles.detailSectionTitle}>Children ({children.length})</p>
                    <div className={styles.relatedList}>
                      {children.map(c => (
                        <button
                          key={c.key}
                          type="button"
                          className={styles.relatedBtn}
                          onClick={() => setSelected(c)}
                        >
                          <TypeIcon type={c.type ?? 'task'} />
                          <span className={styles.relatedKey}>{c.key}</span>
                          <span className={styles.relatedSummary}>{c.summary}</span>
                          <span className={styles.statusLozenge} data-cat={statusCat(c.status)}>
                            <span className={styles.statusDot} aria-hidden="true" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Same epic */}
                {relatedItems.length > 0 && (
                  <section className={styles.detailSection}>
                    <p className={styles.detailSectionTitle}>Same Epic ({relatedItems.length})</p>
                    <div className={styles.relatedList}>
                      {relatedItems.map(r => (
                        <button
                          key={r.key}
                          type="button"
                          className={styles.relatedBtn}
                          onClick={() => setSelected(r)}
                        >
                          <TypeIcon type={r.type ?? 'task'} />
                          <span className={styles.relatedKey}>{r.key}</span>
                          <span className={styles.relatedSummary}>{r.summary}</span>
                          {r.health && (
                            <DCStatusChip
                              label={r.health}
                              tone={r.health === 'critical' ? 'critical' : r.health === 'warning' ? 'warning' : 'success'}
                              size="sm"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

              </div>
            </aside>
          )}
        </div>

      </div>
    </AppShell>
  );
}
