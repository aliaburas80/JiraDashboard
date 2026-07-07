// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
const matchText = (val: unknown, q: string) => !q || norm(val).includes(norm(q));

const HEALTH_COLORS: Record<string, string> = {
  critical: '#DC2626', warning: '#D97706', good: '#059669',
};

function HealthBadge({ value }: { value?: string }) {
  const v = norm(value);
  const color = HEALTH_COLORS[v] ?? '#94A3B8';
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', background: `${color}18`, color }}>
      {value || '—'}
    </span>
  );
}

export default function FlowHealthPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

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

  const inputStyle = {
    border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 10px',
    fontSize: 12, color: '#334155', outline: 'none', width: '100%',
    background: '#fff',
  };
  const selectStyle = { ...inputStyle };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 4 };

  const th = (label: string, width?: number) => (
    <th key={label} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8', borderBottom: '1px solid #E2E8F0', width, whiteSpace: 'nowrap' }}>
      {label}
    </th>
  );

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
        title="Flow Health Table"
        badge={`${filtered.length} of ${flowItems.length} items`}
        subtitle="Filter, inspect, and export every item in this delivery."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Filters ── */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'Key', value: keyFilter, set: setKeyFilter, placeholder: 'AJ-24' },
              { label: 'Story / Task', value: summaryFilter, set: setSummaryFilter, placeholder: 'Summary text' },
              { label: 'Reason', value: reasonFilter, set: setReasonFilter, placeholder: 'Blocked, overdue…' },
              { label: 'Labels', value: labelFilter, set: setLabelFilter, placeholder: 'bug-fix, mobile…' },
              { label: 'Lead ≤ (days)', value: leadMax, set: setLeadMax, placeholder: '30', type: 'number' },
              { label: 'Cycle ≤ (days)', value: cycleMax, set: setCycleMax, placeholder: '14', type: 'number' },
              { label: 'Open Age ≤ (days)', value: ageMax, set: setAgeMax, placeholder: '10', type: 'number' },
            ].map(({ label, value, set, placeholder, type }) => (
              <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelStyle}>{label}</span>
                <input
                  type={type ?? 'search'}
                  value={value}
                  placeholder={placeholder}
                  onChange={e => { set(e.target.value); setVisibleCount(100); }}
                  style={inputStyle}
                />
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Issue Type', value: typeFilter, set: setTypeFilter, opts: typeOptions, allLabel: 'All types' },
              { label: 'Status', value: statusFilter, set: setStatusFilter, opts: statusOptions, allLabel: 'All statuses' },
              { label: 'Sprint', value: sprintFilter, set: setSprintFilter, opts: sprintOptions, allLabel: 'All sprints' },
              { label: 'Assignee', value: assigneeFilter, set: setAssigneeFilter, opts: assigneeOptions, allLabel: 'All assignees' },
              { label: 'Health', value: healthFilter, set: setHealthFilter, opts: ['critical', 'warning', 'good'], allLabel: 'All health' },
            ].map(({ label, value, set, opts, allLabel }) => (
              <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelStyle}>{label}</span>
                <select value={value} onChange={e => { set(e.target.value); setVisibleCount(100); }} style={selectStyle}>
                  <option value="all">{allLabel}</option>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>

          {/* ── Action row ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, marginTop: 14, borderTop: '1px solid #F1F5F9' }}>
            <button
              type="button"
              onClick={resetAll}
              style={{
                padding: '7px 16px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#F8FAFC', color: '#475569', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Reset filters
            </button>
            <button
              type="button"
              onClick={exportCsv}
              style={{
                padding: '7px 16px', borderRadius: 8, border: 'none',
                background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
              {filtered.length.toLocaleString()} of {flowItems.length.toLocaleString()} items
            </span>
          </div>
        </div>

        {/* ── Status distribution of filtered set ── */}
        {statusDist.length > 0 && (
          <SectionCard title="Status Distribution (filtered)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {statusDist.map((r, i) => {
                const isDone = DONE_STATUSES.includes(norm(r.name));
                const isActive = ['in progress', 'code review', 'qa', 'testing'].includes(norm(r.name));
                const color = isDone ? '#059669' : isActive ? '#2563EB' : '#94A3B8';
                return (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 130, fontSize: 11, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: color, width: `${(r.count / statusMax) * 100}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 50}ms` }} />
                    </div>
                    <strong style={{ fontFamily: 'monospace', fontSize: 11, color, width: 36, textAlign: 'right', flexShrink: 0 }}>{r.count}</strong>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ── Summary line ── */}
        <div style={{ fontSize: 11, color: '#64748B', background: '#F8FAFC', borderRadius: 8, padding: '8px 14px', marginBottom: 16 }}>
          Showing <strong style={{ color: '#0F172A' }}>{visible.length}</strong> of <strong style={{ color: '#0F172A' }}>{filtered.length}</strong> matching items from <strong style={{ color: '#0F172A' }}>{flowItems.length}</strong> total.
          {orphanCount > 0 && <span style={{ marginLeft: 10, color: '#7C3AED', fontWeight: 700 }}>{orphanCount} orphan items</span>}
        </div>

        {/* ── Items table ── */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {th('Key', 80)}
                  {th('Summary')}
                  {th('Type', 90)}
                  {th('Status', 110)}
                  {th('Sprint', 110)}
                  {th('Epic / Parent', 120)}
                  {th('Assignee', 110)}
                  {th('Lead', 60)}
                  {th('Cycle', 60)}
                  {th('Age', 60)}
                  {th('Health', 80)}
                  {th('Reason')}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                      No items match the selected filters.
                    </td>
                  </tr>
                ) : visible.map((item, i) => (
                  <tr key={item.key ?? i} style={{ borderBottom: '1px solid #F1F5F9', background: item.isOrphan ? '#F5F3FF' : undefined }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>{item.key}</td>
                    <td style={{ padding: '7px 10px', color: '#334155', maxWidth: 260 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.summary}>{item.summary}</span>
                    </td>
                    <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>{item.type || '—'}</span>
                    </td>
                    <td style={{ padding: '7px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{item.status}</td>
                    <td style={{ padding: '7px 10px', color: '#64748B', whiteSpace: 'nowrap', fontSize: 11 }}>{item.sprint ?? '—'}</td>
                    <td style={{ padding: '7px 10px', color: item.isOrphan ? '#7C3AED' : '#64748B', fontSize: 11 }}>
                      {item.epic ?? item.parent ?? <span style={{ color: '#7C3AED', fontWeight: 600 }}>Orphan</span>}
                    </td>
                    <td style={{ padding: '7px 10px', color: '#64748B', fontSize: 11 }}>{item.assignee ?? '—'}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: Number(item.leadTimeDays) > 14 ? '#D97706' : '#64748B' }}>
                      {item.leadTimeDays != null ? `${item.leadTimeDays}d` : '—'}
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: Number(item.cycleTimeDays) > 14 ? '#D97706' : '#64748B' }}>
                      {item.cycleTimeDays != null ? `${item.cycleTimeDays}d` : '—'}
                    </td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: Number(item.ageDays) > 10 ? '#DC2626' : '#64748B' }}>
                      {item.ageDays != null ? `${item.ageDays}d` : '—'}
                    </td>
                    <td style={{ padding: '7px 10px' }}><HealthBadge value={item.health} /></td>
                    <td style={{ padding: '7px 10px', color: '#64748B', fontSize: 11, maxWidth: 200 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason}>{item.reason || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > visibleCount && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setVisibleCount(c => c + 100)}
                style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}
              >
                Show {Math.min(100, filtered.length - visibleCount)} more
                <span style={{ color: '#94A3B8', marginLeft: 6 }}>— {filtered.length - visibleCount} remaining</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
