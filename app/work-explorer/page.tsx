'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DeliveryClarityShell from '@/components/dc-shell/DeliveryClarityShell';
import DCStatusChip from '@/components/dc-shell/DCStatusChip';
import LoadingState from '@/components/ui/LoadingState';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import { loadMetricsWithSource } from '@/lib/storage';

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
const DONE = new Set(['done', 'closed', 'resolved']);

const TYPE_ICONS: Record<string, string> = {
  bug: '🐛', story: '📖', task: '✅', epic: '⚡', 'sub-task': '🔹',
  'test case': '🧪', feature: '🌟', improvement: '🔧', spike: '🔍',
};

const HEALTH_CHIP_TONE = {
  critical: 'critical' as const,
  warning:  'warning'  as const,
  good:     'success'  as const,
};

export default function WorkExplorerPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [selected, setSelected] = useState<FlowItem | null>(null);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 50;

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

  const items = useMemo(() => metrics?.flow?.items ?? [], [metrics]);

  const types    = useMemo(() => ['all', ...new Set(items.map(i => norm(i.type)).filter(Boolean))].sort(), [items]);
  const statuses = useMemo(() => ['all', ...new Set(items.map(i => norm(i.status)).filter(Boolean))].sort(), [items]);

  const filtered = useMemo(() => {
    const q = norm(search);
    return items.filter(i => {
      if (typeFilter   !== 'all' && norm(i.type)   !== typeFilter)   return false;
      if (statusFilter !== 'all' && norm(i.status) !== statusFilter) return false;
      if (healthFilter !== 'all' && i.health       !== healthFilter) return false;
      if (!q) return true;
      return norm(i.key).includes(q) || norm(i.summary).includes(q) || norm(i.epic).includes(q) || norm(i.assignee).includes(q);
    });
  }, [items, search, typeFilter, statusFilter, healthFilter]);

  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function onFilterChange() { setPage(0); setSelected(null); }

  if (loading) return <DeliveryClarityShell hideSidebar><LoadingState message="Loading work explorer…" /></DeliveryClarityShell>;
  if (!metrics) return null;

  const relatedItems = selected ? items.filter(i => i.epic === selected.epic && i.key !== selected.key).slice(0, 8) : [];
  const children     = selected ? items.filter(i => i.parent === selected.key).slice(0, 10) : [];

  return (
    <DeliveryClarityShell hideSidebar>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 20, height: 2, background: 'var(--blue)', display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--blue)', textTransform: 'uppercase' }}>Data</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--n900)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Work Explorer</h1>
        <p style={{ fontSize: 13, color: 'var(--n500)', margin: 0 }}>
          {filtered.length.toLocaleString()} of {items.length.toLocaleString()} items · Click any row to see details
        </p>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dc-text-3)" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); onFilterChange(); }}
            placeholder="Search by key, summary, epic, assignee…"
            style={{
              width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
              borderRadius: 12, border: '1px solid var(--dc-line)', background: 'var(--dc-surface)',
              fontSize: 13, fontWeight: 600, color: 'var(--dc-text)', outline: 'none',
            }}
            aria-label="Search work items"
          />
        </div>

        {/* Filter chips */}
        {[
          { label: 'Type',   value: typeFilter,   options: types,    setter: (v: string) => { setTypeFilter(v); onFilterChange(); } },
          { label: 'Status', value: statusFilter, options: statuses, setter: (v: string) => { setStatusFilter(v); onFilterChange(); } },
          { label: 'Health', value: healthFilter, options: ['all', 'critical', 'warning', 'good'], setter: (v: string) => { setHealthFilter(v); onFilterChange(); } },
        ].map(f => (
          <select
            key={f.label}
            value={f.value}
            onChange={e => f.setter(e.target.value)}
            style={{
              padding: '9px 12px', borderRadius: 12, border: '1px solid var(--dc-line)',
              background: 'var(--dc-surface)', fontSize: 12, fontWeight: 700,
              color: f.value !== 'all' ? 'var(--dc-brand)' : 'var(--dc-text-2)',
              cursor: 'pointer', maxWidth: 180,
            }}
            aria-label={`Filter by ${f.label}`}
          >
            <option value="all">All {f.label}s</option>
            {f.options.filter(o => o !== 'all').map(o => (
              <option key={o} value={o} style={{ textTransform: 'capitalize' }}>{o}</option>
            ))}
          </select>
        ))}

        {(search || typeFilter !== 'all' || statusFilter !== 'all' || healthFilter !== 'all') && (
          <button
            type="button"
            onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setHealthFilter('all'); setPage(0); setSelected(null); }}
            style={{ fontSize: 12, fontWeight: 800, color: 'var(--dc-text-2)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0,1fr) 360px' : '1fr', gap: 20 }}>

        {/* Issue table */}
        <div className="dc-card" style={{ overflow: 'hidden' }}>
          {pageItems.length === 0 ? (
            <div style={{ padding: '40px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--dc-text-3)', fontWeight: 700 }}>No items match your filters</p>
              <p style={{ fontSize: 12, color: 'var(--dc-text-3)', margin: '6px 0 0' }}>Try adjusting the search or filters above</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--dc-line)', background: 'var(--dc-surface-soft)' }}>
                      {['Key', 'Summary', 'Type', 'Status', 'Health', 'Assignee', 'Age (d)'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 900, color: 'var(--dc-text-3)', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, i) => {
                      const isSelected = selected?.key === item.key;
                      return (
                        <tr
                          key={item.key}
                          onClick={() => setSelected(isSelected ? null : item)}
                          style={{
                            borderBottom: '1px solid var(--dc-line)',
                            background: isSelected ? 'var(--dc-brand-soft)' : i % 2 === 1 ? 'var(--dc-surface-soft)' : 'white',
                            cursor: 'pointer', transition: 'background 100ms',
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--dc-brand-soft)'; }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 1 ? 'var(--dc-surface-soft)' : 'white'; }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={`${item.key}: ${item.summary}`}
                          onKeyDown={e => e.key === 'Enter' && setSelected(isSelected ? null : item)}
                        >
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 900, color: 'var(--dc-brand)', whiteSpace: 'nowrap' }}>{item.key}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--dc-text)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{item.summary}</td>
                          <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--dc-text-2)', textTransform: 'capitalize' }}>
                              {TYPE_ICONS[norm(item.type)] ?? ''} {item.type}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
                              background: DONE.has(norm(item.status)) ? 'var(--dc-success-soft)' : 'var(--dc-surface-blue)',
                              color: DONE.has(norm(item.status)) ? '#15803D' : 'var(--dc-text-2)',
                              textTransform: 'capitalize',
                            }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                            {item.health && <DCStatusChip label={item.health} tone={HEALTH_CHIP_TONE[item.health as keyof typeof HEALTH_CHIP_TONE] ?? 'neutral'} />}
                          </td>
                          <td style={{ padding: '8px 12px', color: 'var(--dc-text-2)', whiteSpace: 'nowrap', fontWeight: 600 }}>{item.assignee || '—'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap', color: Number(item.ageDays ?? 0) > 14 ? 'var(--dc-critical)' : 'var(--dc-text-2)' }}>{item.ageDays ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--dc-line)' }}>
                  <span style={{ fontSize: 12, color: 'var(--dc-text-2)', fontWeight: 600 }}>
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--dc-line)', background: 'none', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, color: page === 0 ? 'var(--dc-text-3)' : 'var(--dc-text)' }}>← Prev</button>
                    <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--dc-line)', background: 'none', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, color: page >= totalPages - 1 ? 'var(--dc-text-3)' : 'var(--dc-text)' }}>Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Issue detail panel */}
        {selected && (
          <div className="dc-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 900, color: 'var(--dc-brand)' }}>{selected.key}</span>
                <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--dc-text)', margin: '4px 0 0', lineHeight: 1.4 }}>{selected.summary}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--dc-text-3)', padding: 0, flexShrink: 0 }} aria-label="Close detail">×</button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <DCStatusChip label={selected.type || 'Unknown'} tone="neutral" />
              <DCStatusChip label={selected.status} tone={DONE.has(norm(selected.status)) ? 'success' : 'neutral'} />
              {selected.health && <DCStatusChip label={selected.health} tone={HEALTH_CHIP_TONE[selected.health as keyof typeof HEALTH_CHIP_TONE] ?? 'neutral'} />}
              {selected.priority && <DCStatusChip label={selected.priority} tone="neutral" />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Assignee',    value: selected.assignee || '—' },
                { label: 'Epic',        value: selected.epic || '—' },
                { label: 'Sprint',      value: selected.sprint || '—' },
                { label: 'Project',     value: selected.project || '—' },
                { label: 'Story pts',   value: selected.storyPoints || '—' },
                { label: 'Age (days)',  value: selected.ageDays ?? '—' },
                { label: 'Lead time',   value: selected.leadTimeDays != null ? `${selected.leadTimeDays}d` : '—' },
                { label: 'Cycle time',  value: selected.cycleTimeDays != null ? `${selected.cycleTimeDays}d` : '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--dc-text-3)', fontWeight: 700, width: 90, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ color: 'var(--dc-text)', fontWeight: 600, flex: 1 }}>{String(row.value)}</span>
                </div>
              ))}
            </div>

            {selected.reason && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--dc-warning-soft)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#92400E', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health note</p>
                <p style={{ fontSize: 12, color: '#B45309', margin: 0 }}>{selected.reason}</p>
              </div>
            )}

            {children.length > 0 && (
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Children ({children.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {children.map(c => (
                    <button key={c.key} type="button" onClick={() => setSelected(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--dc-line)', background: 'var(--dc-surface-soft)', textAlign: 'left', cursor: 'pointer' }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 900, color: 'var(--dc-brand)' }}>{c.key}</span>
                      <span style={{ fontSize: 11, color: 'var(--dc-text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.summary}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {relatedItems.length > 0 && (
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 900, color: 'var(--dc-text)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Same Epic ({relatedItems.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {relatedItems.map(r => (
                    <button key={r.key} type="button" onClick={() => setSelected(r)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--dc-line)', background: 'var(--dc-surface-soft)', textAlign: 'left', cursor: 'pointer' }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 900, color: 'var(--dc-brand)' }}>{r.key}</span>
                      <span style={{ fontSize: 11, color: 'var(--dc-text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary}</span>
                      {r.health && <DCStatusChip label={r.health} tone={HEALTH_CHIP_TONE[r.health as keyof typeof HEALTH_CHIP_TONE] ?? 'neutral'} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DeliveryClarityShell>
  );
}
