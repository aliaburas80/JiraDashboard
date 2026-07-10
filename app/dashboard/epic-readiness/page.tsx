// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import {
  StickyToolbar, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';

export default function EpicReadinessPage() {
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

  const flowItems: FlowItem[] = useMemo(() => {
    const raw = metrics?.flow?.items ?? [];
    const seen = new Set<string>();
    return raw.filter(i => { if (seen.has(i.key)) return false; seen.add(i.key); return true; });
  }, [metrics?.flow?.items]);

  const epicReadiness = useMemo(() => {
    const epics = (metrics?.epics as any[]) ?? [];
    return epics.map(e => ({
      ...e,
      completion: e.progress ?? e.completion ?? 0,
      risk: (e.critical ?? 0) > 0 ? 'critical' : (e.warning ?? 0) > 0 ? 'warning' : 'good',
    }));
  }, [metrics?.epics]);

  const atRisk = useMemo(
    () => epicReadiness.filter(e => e.risk === 'critical' || e.completion < 60),
    [epicReadiness]
  );

  const dependencyItems = useMemo(
    () => flowItems.filter(i => (i as any).dependsOn || (i as any).externalEpic),
    [flowItems]
  );

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const criticalEpics = epicReadiness.filter(e => e.risk === 'critical').length;

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        id="tour-header-epic-readiness"
        title="Epic Readiness"
        badge={criticalEpics > 0 ? `${criticalEpics} critical` : 'Good'}
        subtitle={`${epicReadiness.length} epics tracked · at-risk epics and dependency callouts.`}
      />

      <div style={{ padding: '0 28px 48px' }}>

        {/* ── Epic summary KPIs ── */}
        <div id="tour-section-epic-readiness-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Epics', value: epicReadiness.length, color: '#475569', bg: '#F8FAFC', border: '#E2E8F0' },
            { label: 'On Track', value: epicReadiness.filter(e => e.risk === 'good' && e.completion >= 60).length, color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
            { label: 'At Risk', value: epicReadiness.filter(e => e.risk === 'warning').length, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
            { label: 'Critical', value: criticalEpics, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94A3B8', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* ── At-risk epics ── */}
          <SectionCard title="Top At-Risk Epics">
            {atRisk.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No at-risk epics detected.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {atRisk.slice(0, 8).map((e: any, i: number) => {
                  const prog = Math.min(100, e.completion ?? 0);
                  const riskColor = e.risk === 'critical' ? '#DC2626' : e.risk === 'warning' ? '#D97706' : '#059669';
                  const riskBg = e.risk === 'critical' ? '#FEF2F2' : e.risk === 'warning' ? '#FFFBEB' : '#F0FDF4';
                  return (
                    <div key={e.epic ?? e.id ?? i} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {e.epic ?? e.id ?? 'Unknown Epic'}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', background: riskBg, color: riskColor, flexShrink: 0 }}>
                          {e.risk}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: prog >= 70 ? '#059669' : prog >= 40 ? '#D97706' : '#DC2626', width: `${prog}%`, animation: 'barFill 800ms ease-out both', transformOrigin: 'left center' }} />
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0F172A', width: 32, textAlign: 'right', flexShrink: 0 }}>{prog}%</span>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 10, color: '#94A3B8' }}>
                        {e.issues ?? 0} issues · {e.completedIssues ?? e.done ?? 0} done
                        {(e.critical ?? 0) > 0 && <span style={{ color: '#DC2626', marginLeft: 8 }}>{e.critical} critical</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ── Dependency callouts ── */}
          <SectionCard title="Dependency Callouts">
            <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>Items referencing other epics or external blockers.</p>
            {dependencyItems.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No dependency callouts detected.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dependencyItems.slice(0, 12).map((item, i) => (
                  <div key={item.key ?? i} style={{ fontSize: 12, color: '#334155', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>{item.key}</span>
                    {': '}
                    <span>{item.summary}</span>
                    {(item as any).dependsOn && (
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>depends on {(item as any).dependsOn}</div>
                    )}
                    {(item as any).externalEpic && (
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>external epic: {(item as any).externalEpic}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── All epics table ── */}
        {epicReadiness.length > 0 && (
          <SectionCard title={`All Epics  ·  ${epicReadiness.length} total`}>
            <div id="tour-section-epic-readiness-2" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Epic / Parent', 'Issues', 'Done', 'Critical', 'Warning', 'Progress', 'Risk'].map(label => (
                      <th key={label} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#94A3B8', borderBottom: '1px solid #E2E8F0' }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {epicReadiness.map((e: any, i: number) => {
                    const prog = Math.min(100, e.completion ?? 0);
                    const riskColor = e.risk === 'critical' ? '#DC2626' : e.risk === 'warning' ? '#D97706' : '#059669';
                    return (
                      <tr key={e.epic ?? e.id ?? i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '7px 10px', color: '#334155', fontWeight: 600, maxWidth: 200 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.epic ?? e.id ?? '—'}</span>
                        </td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11 }}>{e.issues ?? 0}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#059669' }}>{e.completedIssues ?? e.done ?? 0}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: (e.critical ?? 0) > 0 ? '#DC2626' : '#64748B' }}>{e.critical ?? 0}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: (e.warning ?? 0) > 0 ? '#D97706' : '#64748B' }}>{e.warning ?? 0}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 64, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 3, background: prog >= 70 ? '#059669' : prog >= 40 ? '#D97706' : '#DC2626', width: `${prog}%`, animation: 'barFill 800ms ease-out both', transformOrigin: 'left center' }} />
                            </div>
                            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748B' }}>{prog}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', color: riskColor }}>
                            {e.risk}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>
    </>
  );
}
