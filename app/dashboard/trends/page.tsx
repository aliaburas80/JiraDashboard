// @ts-nocheck
'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import { buildSafeCsv } from '@/lib/exportSafety';
import type { FlowItem } from '@/types/metrics';
import {
  StickyToolbar, FilterChip, ToolbarSpacer, ToolbarButton,
  PageHeader, SectionCard, PageLoading, EmptyPage,
} from '@/components/dashboard/DashboardPageShell';
import styles from './page.module.scss';

// STYLE-03 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token mapping notes. No behavior change.

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

const DONE_STATUSES = ['done', 'closed', 'resolved'];
const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

function completionTier(pct: number): 'good' | 'fair' | 'poor' {
  if (pct >= 70) return 'good';
  if (pct >= 50) return 'fair';
  return 'poor';
}

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

  const kpis = [
    { label: 'Sprint Items', value: sprintItems.length, kpi: 'primary' },
    { label: 'Completed', value: sprintItems.filter(i => DONE_STATUSES.includes(norm(i.status))).length, kpi: 'success' },
    { label: 'In Progress', value: sprintItems.filter(i => norm(i.status) === 'in progress').length, kpi: 'warning' },
    { label: 'Blocked', value: blockedInSprint.length, kpi: blockedInSprint.length > 0 ? 'critical' : 'success' },
  ];

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

      <div className={styles.page} id="tour-section-trends-content">

        {view === 'sprint' && (!sprint ? (
          <EmptyPage message="No sprint data detected. Upload a file with Sprint field data to see sprint metrics." />
        ) : (
          <>
            {/* ── Sprint gauges ── */}
            <div className={styles.kpiGrid}>
              {kpis.map(({ label, value, kpi }) => (
                <div key={label} className={styles.kpiCard} data-kpi={kpi}>
                  <p className={styles.kpiLabel}>{label}</p>
                  <p className={styles.kpiValue} data-kpi={kpi}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Sprint velocity ── */}
            {typeof sprint.velocity !== 'undefined' && (
              <SectionCard title="Sprint Velocity">
                <div className={styles.velocityGrid}>
                  {[
                    { label: 'Velocity', value: sprint.velocity ?? '—' },
                    { label: 'Avg Velocity', value: sprint.averageVelocity ?? '—' },
                    { label: 'Predictability', value: sprint.predictability != null ? `${sprint.predictability}%` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className={styles.velocityCard}>
                      <p className={styles.velocityLabel}>{label}</p>
                      <p className={styles.velocityValue}>{value}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── Sprint history ── */}
            {sprintDist.length > 0 && (
              <SectionCard title="Sprint Completion History">
                <div className={styles.sprintList}>
                  {sprintDist.map((s, i) => {
                    const good = s.completion >= 70;
                    const barVars: CSSVariableProperties = { '--bar-width': `${s.completion}%`, '--bar-delay': `${i * 70}ms` };
                    return (
                      <div key={s.name}>
                        <div className={styles.sprintHeadRow}>
                          <span className={styles.sprintName} data-latest={i === 0 || undefined}>{s.name}</span>
                          <div className={styles.sprintStats}>
                            <span>{s.done}/{s.total} done</span>
                            {s.blocked > 0 && <span className={styles.sprintBlocked}>{s.blocked} blocked</span>}
                            <strong className={styles.sprintCompletion} data-good={good || undefined}>{s.completion}%</strong>
                          </div>
                        </div>
                        <div className={styles.sprintTrack}>
                          <div className={styles.sprintFill} data-good={good || undefined} style={barVars} />
                        </div>
                      </div>
                    );
                  })}
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
              <div className={styles.quarterList}>
                {quarters.map((q: any, i: number) => {
                  const pct = Math.round((q.issues / qMax) * 100);
                  const donePct = q.issues > 0 ? Math.round(((q.done ?? 0) / q.issues) * 100) : 0;
                  const isLatest = i === 0;
                  const totalVars: CSSVariableProperties = { '--bar-width': `${pct}%`, '--bar-delay': `${i * 65}ms` };
                  const doneVars: CSSVariableProperties = { '--bar-width': `${(q.done / qMax) * 100}%`, '--bar-delay': `${i * 65 + 200}ms` };
                  return (
                    <div key={q.quarter ?? i}>
                      <div className={styles.quarterRow}>
                        <span className={styles.quarterLabel} data-latest={isLatest || undefined}>{q.quarter}</span>
                        <div className={styles.quarterTrack}>
                          <div className={styles.quarterFillTotal} data-latest={isLatest || undefined} style={totalVars} />
                          {q.done > 0 && (
                            <div className={styles.quarterFillDone} style={doneVars} />
                          )}
                        </div>
                        <div className={styles.quarterMeta}>
                          <span className={styles.quarterCount}>{(q.issues || 0).toLocaleString()}</span>
                          <span className={styles.quarterPctBadge} data-good={donePct >= 70 || undefined}>
                            {donePct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className={styles.chartLegend}>
                  <div className={styles.legendItem}><span className={styles.legendSwatch} />Total issues</div>
                  <div className={styles.legendItem}><span className={styles.legendSwatch} data-swatch="done" />Done</div>
                </div>
              </div>
            </SectionCard>

            {/* ── Quarter table ── */}
            <SectionCard title="Quarterly Breakdown">
              <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr className={styles.tableHeadRow}>
                      {['Quarter', 'Total Issues', 'Completed', 'Completion Rate'].map(h => (
                        <th key={h} className={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.map((q: any, i: number) => {
                      const donePct = q.issues > 0 ? Math.round(((q.done ?? 0) / q.issues) * 100) : 0;
                      const isLatest = i === 0;
                      return (
                        <tr key={q.quarter ?? i} className={styles.tableRow}>
                          <td className={styles.cellQuarter} data-latest={isLatest || undefined}>{q.quarter}</td>
                          <td className={styles.cellIssues}>{(q.issues || 0).toLocaleString()}</td>
                          <td className={styles.cellDone}>{(q.done || 0).toLocaleString()}</td>
                          <td className={styles.cellCompletion}>
                            <span className={styles.completionBadge} data-tier={completionTier(donePct)}>
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
