// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';
import {
  StickyToolbar, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

const TYPE_COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export default function LabelsTypesPage() {
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
      } catch { if (!cancelled) router.replace('/'); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  const labelData = useMemo(() => (metrics?.labels as any) ?? null, [metrics]);
  const types     = useMemo(() => (metrics?.types as any[]) ?? [], [metrics]);
  const parents   = useMemo(() => (metrics?.parents as any[]) ?? [], [metrics]);
  const projects  = useMemo(() => (metrics?.projects as any[]) ?? [], [metrics]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const labelStats = (labelData?.labelStats ?? []).filter((l: any) => l.label !== '(unlabeled)');
  const labelMax   = Math.max(...labelStats.map((l: any) => l.count ?? 0), 1);
  const typeMax    = Math.max(...types.map((t: any) => t.count ?? 0), 1);
  const parentMax  = Math.max(...parents.map((p: any) => p.count ?? 0), 1);

  const th = (label: string) => (
    <th key={label} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8', borderBottom: '1px solid #E2E8F0' }}>
      {label}
    </th>
  );

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        title="Labels & Types"
        badge={labelData ? `${labelData.uniqueLabels ?? 0} labels` : undefined}
        subtitle="Label distribution, issue type breakdown, and project classification."
      />

      <div style={{ padding: '0 28px 48px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* ── Label distribution ── */}
          <SectionCard title="Label Distribution">
            {labelStats.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No label data found.</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 20, padding: '2px 10px' }}>
                    {labelData.uniqueLabels} unique labels
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 20, padding: '2px 10px' }}>
                    {labelData.totalUnlabeled ?? 0} unlabeled
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {labelStats.slice(0, 8).map((l: any, i: number) => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 110, fontSize: 11, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.label}>{l.label}</span>
                      <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: '#2563EB', width: `${(l.count / labelMax) * 100}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 55}ms` }} />
                      </div>
                      <strong style={{ fontFamily: 'monospace', fontSize: 11, color: '#2563EB', width: 30, textAlign: 'right', flexShrink: 0 }}>{l.count}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          {/* ── Type breakdown ── */}
          <SectionCard title="Issue Type Breakdown">
            {types.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No issue type data found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {types.slice(0, 8).map((t: any, i: number) => (
                  <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 110, fontSize: 11, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.type}>{t.type}</span>
                    <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: TYPE_COLORS[i % TYPE_COLORS.length], width: `${(t.count / typeMax) * 100}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 55}ms` }} />
                    </div>
                    <strong style={{ fontFamily: 'monospace', fontSize: 11, color: TYPE_COLORS[i % TYPE_COLORS.length], width: 30, textAlign: 'right', flexShrink: 0 }}>{t.count}</strong>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Label health table ── */}
        {labelStats.length > 0 && (
          <SectionCard title="Label Health & Completion">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Label', 'Issues', 'Done', 'Completion', 'Critical', 'Warning', 'Points', 'Avg Lead', 'Avg Cycle'].map(th)}</tr>
                </thead>
                <tbody>
                  {labelStats.map((l: any, i: number) => {
                    const prog = Math.min(100, l.completionRate ?? 0);
                    return (
                      <tr key={l.label ?? i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '7px 10px', color: '#334155', fontWeight: 600 }}>{l.label}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11 }}>{l.count ?? 0}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11 }}>{l.done ?? 0}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 3, background: prog >= 70 ? '#059669' : '#D97706', width: `${prog}%`, animation: 'barFill 800ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 35}ms` }} />
                            </div>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748B' }}>{prog}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: (l.critical ?? 0) > 0 ? '#DC2626' : '#64748B' }}>{l.critical ?? 0}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: (l.warning ?? 0) > 0 ? '#D97706' : '#64748B' }}>{l.warning ?? 0}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11 }}>{l.storyPoints ?? 0}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11 }}>{l.averageLeadTimeDays != null ? `${l.averageLeadTimeDays}d` : '—'}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11 }}>{l.averageCycleTimeDays != null ? `${l.averageCycleTimeDays}d` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* ── Parent & Project breakdown ── */}
        {(parents.length > 0 || projects.length > 1) && (
          <div style={{ display: 'grid', gridTemplateColumns: parents.length > 0 && projects.length > 1 ? '1fr 1fr' : '1fr', gap: 20 }}>
            {parents.length > 0 && (
              <SectionCard title="Parent Key Breakdown">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {parents.slice(0, 8).map((p: any, i: number) => (
                    <div key={p.parent ?? i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 100, fontSize: 11, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.parent}>{p.parent}</span>
                      <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: '#7C3AED', width: `${((p.count ?? 0) / parentMax) * 100}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 55}ms` }} />
                      </div>
                      <strong style={{ fontFamily: 'monospace', fontSize: 11, color: '#7C3AED', width: 30, textAlign: 'right', flexShrink: 0 }}>{p.count}</strong>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
            {projects.length > 1 && (
              <SectionCard title="Project Breakdown">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {projects.map((p: any, i: number) => {
                    const projectMax = Math.max(...projects.map((x: any) => x.count ?? 0), 1);
                    return (
                      <div key={p.project ?? i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 100, fontSize: 11, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.project}>{p.project}</span>
                        <div style={{ flex: 1, height: 7, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 4, background: '#0891B2', width: `${((p.count ?? 0) / projectMax) * 100}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${i * 55}ms` }} />
                        </div>
                        <strong style={{ fontFamily: 'monospace', fontSize: 11, color: '#0891B2', width: 30, textAlign: 'right', flexShrink: 0 }}>{p.count}</strong>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </>
  );
}
