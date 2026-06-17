// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { DashboardMetrics } from '@/types/metrics';
import {
  StickyToolbar, ToolbarSpacer, ToolbarButton,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

export default function QuarterStatisticsPage() {
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

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const quarters = ((metrics.quarters as any[]) ?? []).sort((a, b) => String(b.quarter ?? '').localeCompare(String(a.quarter ?? '')));
  const qMax = Math.max(...quarters.map((q: any) => q.issues || 0), 1);

  const exportCSV = () => {
    const cols = ['Quarter', 'Issues', 'Done', 'Completion'];
    const csv = [cols.join(','), ...quarters.map((q: any) => [
      q.quarter, q.issues, q.done ?? 0, q.issues > 0 ? `${Math.round(((q.done ?? 0) / q.issues) * 100)}%` : '0%',
    ].map(c => `"${c}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'quarter-statistics.csv'; a.click();
  };

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />
        <ToolbarButton label="Export" onClick={exportCSV} />

      </StickyToolbar>

      <PageHeader
        title="Quarter Statistics"
        badge={`${quarters.length}Q`}
        subtitle="Quarter-over-quarter throughput, completion, and delivery trends."
      />

      <div style={{ padding: '0 28px 48px' }}>

        {quarters.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
            <SvgIcon name="chartBar" size={36} style={{ margin: '0 auto 12px' }} />
            No quarterly data available. Upload a file with date fields to see trends.
          </div>
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
        )}
      </div>
    </>
  );
}
