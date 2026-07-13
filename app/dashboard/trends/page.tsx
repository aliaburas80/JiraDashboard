// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton,
  PageHeader, SectionCard, PageLoading, EmptyPage,
} from '@/components/dashboard/DashboardPageShell';

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

export default function TrendsPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboardMetrics();
  const [view, setView] = useState<'sprint' | 'quarter'>('sprint');

  useEffect(() => {
    if (!loading && !metrics) router.replace('/');
  }, [loading, metrics, router]);

  const flowItems: FlowItem[] = useMemo(() => {
    const raw = metrics?.flow?.items ?? [];
    const seen = new Set<string>();
    return raw.filter(i => { if (seen.has(i.key)) return false; seen.add(i.key); return true; });
  }, [metrics?.flow?.items]);

  const sprintDist = useMemo(() => {
    const map = new Map<string, { total: number; done: number; blocked: number }>();
    flowItems.forEach(i => {
      const s = String(i.sprint ?? 'No Sprint');
      if (!map.has(s)) map.set(s, { total: 0, done: 0, blocked: 0 });
      const entry = map.get(s)!;
      entry.total++;
      if (DONE_STATUSES.includes(norm(i.status))) entry.done++;
      if (norm(i.reason).includes('block')) entry.blocked++;
    });
    return [...map.entries()].map(([name, data]) => ({ name, ...data, completion: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0 }))
      .filter(s => s.name !== 'No Sprint')
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(0, 10);
  }, [flowItems]);

  const { quarters, qMax } = useMemo(() => {
    const sorted = ((metrics?.quarters as any[]) ?? []).sort((a, b) => String(b.quarter ?? '').localeCompare(String(a.quarter ?? '')));
    return { quarters: sorted, qMax: Math.max(...sorted.map((q: any) => q.issues || 0), 1) };
  }, [metrics?.quarters]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const sprint = metrics.sprint as any;
  const sprintItems = flowItems.filter(i => i.sprint);
  const blockedInSprint = sprintItems.filter(i => norm(i.reason).includes('block'));

  const exportQuartersCSV = () => {
    const cols = ['Quarter', 'Issues', 'Done', 'Completion'];
    const csv = buildSafeCsv([cols, ...quarters.map((q: any) => [
      q.quarter, q.issues, q.done ?? 0, q.issues > 0 ? `${Math.round(((q.done ?? 0) / q.issues) * 100)}%` : '0%',
    ])], { alwaysQuote: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'trends-quarterly.csv'; a.click();
  };

  return (
    <>
      <StickyToolbar>
        <FilterChip label="Sprints" active={view === 'sprint'} onClick={() => setView('sprint')} />
        <FilterChip label="Quarters" active={view === 'quarter'} onClick={() => setView('quarter')} />
        <ToolbarSpacer />
        {view === 'quarter' && <ToolbarButton label="Export" onClick={exportQuartersCSV} />}
      </StickyToolbar>

      <PageHeader
        id="tour-header-trends"
        title="Trends"
        badge={view === 'sprint' ? (sprint ? 'Active' : 'No Sprint') : `${quarters.length}Q`}
        subtitle="Sprint velocity and quarter-over-quarter delivery trends."
      />

      <div style={{ padding: '0 28px 48px' }} id="tour-section-trends-content">

        {view === 'sprint' && (!sprint ? (
          <EmptyPage message="No sprint data detected. Upload a file with Sprint field data to see sprint metrics." />
        ) : (
          <>
            {/* ── Sprint gauges ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Sprint Items', value: sprintItems.length, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                { label: 'Completed', value: sprintItems.filter(i => DONE_STATUSES.includes(norm(i.status))).length, color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
                { label: 'In Progress', value: sprintItems.filter(i => norm(i.status) === 'in progress').length, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                { label: 'Blocked', value: blockedInSprint.length, color: blockedInSprint.length > 0 ? '#DC2626' : '#059669', bg: '#FEF2F2', border: '#FECACA' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Sprint velocity ── */}
            {typeof sprint.velocity !== 'undefined' && (
              <SectionCard title="Sprint Velocity">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {[
                    { label: 'Velocity', value: sprint.velocity ?? '—' },
                    { label: 'Avg Velocity', value: sprint.averageVelocity ?? '—' },
                    { label: 'Predictability', value: sprint.predictability != null ? `${sprint.predictability}%` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: 20, fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Sprint history ── */}
            {sprintDist.length > 0 && (
              <SectionCard title="Sprint Completion History">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sprintDist.map((s, i) => (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                        <span style={{ color: '#334155', fontWeight: i === 0 ? 700 : 400 }}>{s.name}</span>
                        <div style={{ display: 'flex', gap: 12, color: '#64748B' }}>
                          <span>{s.done}/{s.total} done</span>
                          {s.blocked > 0 && <span style={{ color: '#DC2626' }}>{s.blocked} blocked</span>}
                          <strong style={{ color: s.completion >= 70 ? '#059669' : '#D97706', fontFamily: 'monospace' }}>{s.completion}%</strong>
                        </div>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: s.completion >= 70 ? '#059669' : '#D97706', width: `${s.completion}%`, animation: 'barFill 800ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 70}ms` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        ))}

        {view === 'quarter' && (quarters.length === 0 ? (
          <EmptyPage message="No quarterly data available. Upload a file with date fields to see trends." />
        ) : (
          <>
            {/* ── Quarter chart ── */}
            <SectionCard title="Throughput by Quarter">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {quarters.map((q: any, i: number) => {
                  const pct = Math.round((q.issues / qMax) * 100);
                  const donePct = q.issues > 0 ? Math.round(((q.done ?? 0) / q.issues) * 100) : 0;
                  const isLatest = i === 0;
                  return (
                    <div key={q.quarter ?? i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ width: 50, fontSize: 11, fontWeight: 700, color: isLatest ? '#2563EB' : '#475569', flexShrink: 0 }}>{q.quarter}</span>
                        <div style={{ flex: 1, height: 20, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden', position: 'relative' }}>
                          <div style={{ height: '100%', borderRadius: 4, background: isLatest ? '#2563EB' : '#94A3B8', width: `${pct}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 65}ms`, opacity: 0.8 }} />
                          {q.done > 0 && (
                            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 4, background: '#059669', width: `${(q.done / qMax) * 100}%`, animation: 'barFill 900ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 65 + 200}ms`, opacity: 0.6 }} />
                          )}
                        </div>
                        <div style={{ width: 110, flexShrink: 0, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{(q.issues || 0).toLocaleString()}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: donePct >= 70 ? '#F0FDF4' : '#FFFBEB', color: donePct >= 70 ? '#059669' : '#D97706' }}>
                            {donePct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94A3B8', marginTop: 4, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#94A3B8', opacity: 0.8 }} />Total issues</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669', opacity: 0.6 }} />Done</div>
                </div>
              </div>
            </SectionCard>

            {/* ── Quarter table ── */}
            <SectionCard title="Quarterly Breakdown">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                      {['Quarter', 'Total Issues', 'Completed', 'Completion Rate'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.map((q: any, i: number) => {
                      const donePct = q.issues > 0 ? Math.round(((q.done ?? 0) / q.issues) * 100) : 0;
                      return (
                        <tr key={q.quarter ?? i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: i === 0 ? '#2563EB' : '#334155', fontFamily: 'monospace' }}>{q.quarter}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#475569' }}>{(q.issues || 0).toLocaleString()}</td>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#059669' }}>{(q.done || 0).toLocaleString()}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: donePct >= 70 ? '#F0FDF4' : donePct >= 50 ? '#FFFBEB' : '#FEF2F2', color: donePct >= 70 ? '#059669' : donePct >= 50 ? '#D97706' : '#DC2626' }}>
                              {donePct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </>
        ))}
      </div>
    </>
  );
}
