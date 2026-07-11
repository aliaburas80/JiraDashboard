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

export default function OwnershipCapacityPage() {
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

  const capacity = useMemo(() => (metrics?.capacity ?? []) as any[], [metrics]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const capMax = Math.max(...capacity.map((c: any) => c.issues ?? 0), 1);

  const th = (label: string) => (
    <th key={label} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8', borderBottom: '1px solid #E2E8F0' }}>
      {label}
    </th>
  );
  const td = (content: React.ReactNode, opts?: { mono?: boolean; color?: string }) => (
    <td style={{ padding: '7px 10px', fontSize: 12, color: opts?.color ?? '#334155', fontFamily: opts?.mono ? 'monospace' : undefined }}>
      {content}
    </td>
  );

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        id="tour-header-ownership"
        title="Ownership & Capacity"
        subtitle="Team load distribution and per-assignee metrics. See Epic Readiness for epic-level ownership."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Capacity bar chart ── */}
        <SectionCard title="Capacity by Assignee">
          {capacity.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94A3B8' }}>No assignee data found.</p>
          ) : (
            <div id="tour-section-ownership-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {capacity.slice(0, 10).map((c: any, idx: number) => {
                const pct = Math.round(((c.issues ?? 0) / capMax) * 100);
                const skewed = (c.loadShare ?? 0) > 35;
                return (
                  <div key={c.assignee} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 140, fontSize: 12, color: '#334155', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.assignee}>{c.assignee}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: skewed ? '#DC2626' : '#2563EB', width: `${pct}%`, animation: 'barFill 700ms ease-out both', transformOrigin: 'left center', animationDelay: `${idx * 60}ms` }} />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: skewed ? '#DC2626' : '#475569', width: 80, textAlign: 'right', flexShrink: 0 }}>
                      {c.issues} issues · {c.loadShare ?? 0}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Capacity table ── */}
        {capacity.length > 0 && (
          <SectionCard title="Assignee Detail">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Assignee', 'Issues', 'Active', 'Points', 'Load %'].map(th)}</tr>
                </thead>
                <tbody>
                  {capacity.map((c: any, i: number) => (
                    <tr key={c.assignee ?? i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {td(c.assignee ?? '—')}
                      {td(c.issues ?? 0, { mono: true })}
                      {td(c.activeIssues ?? 0, { mono: true })}
                      {td(c.storyPoints ?? 0, { mono: true })}
                      {td(`${c.loadShare ?? 0}%`, { mono: true, color: (c.loadShare ?? 0) > 35 ? '#DC2626' : '#059669' })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}
