// @ts-nocheck
'use client';

import { useEffect, useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import {
  StickyToolbar, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';
import styles from './page.module.scss';

// STYLE-03 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token/palette mapping notes. No behavior change.

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

const TYPE_SERIES_COUNT = 6;

function barVars(pct: number, delayMs: number): CSSVariableProperties {
  return { '--bar-width': `${pct}%`, '--bar-delay': `${delayMs}ms` };
}

export default function LabelsTypesPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboardMetrics();

  useEffect(() => {
    if (!loading && !metrics) router.replace('/');
  }, [loading, metrics, router]);

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

  return (
    <>
      <StickyToolbar>
        <ToolbarSpacer />

      </StickyToolbar>

      <PageHeader
        id="tour-header-labels"
        title="Labels & Types"
        badge={labelData ? `${labelData.uniqueLabels ?? 0} labels` : undefined}
        subtitle="Label distribution, issue type breakdown, and project classification."
      />

      <div className={styles.page}>

        <div className={styles.grid2}>

          {/* ── Label distribution ── */}
          <SectionCard title="Label Distribution">
            {labelStats.length === 0 ? (
              <p className={styles.emptyNote}>No label data found.</p>
            ) : (
              <>
                <div id="tour-section-labels-1" className={styles.chipRow}>
                  <span className={clsx(styles.chip, styles.chipPrimary)}>
                    {labelData.uniqueLabels} unique labels
                  </span>
                  <span className={clsx(styles.chip, styles.chipNeutral)}>
                    {labelData.totalUnlabeled ?? 0} unlabeled
                  </span>
                </div>
                <div className={styles.barList}>
                  {labelStats.slice(0, 8).map((l: any, i: number) => (
                    <div key={l.label} className={styles.barRow}>
                      <span className={styles.barLabel} title={l.label}>{l.label}</span>
                      <div className={styles.barTrack}>
                        <div className={clsx(styles.barFill, styles.barFillPrimary)} style={barVars((l.count / labelMax) * 100, i * 55)} />
                      </div>
                      <strong className={clsx(styles.barCount, styles.barCountPrimary)}>{l.count}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>

          {/* ── Type breakdown ── */}
          <SectionCard title="Issue Type Breakdown">
            {types.length === 0 ? (
              <p className={styles.emptyNote}>No issue type data found.</p>
            ) : (
              <div className={styles.barList}>
                {types.slice(0, 8).map((t: any, i: number) => {
                  const series = String(i % TYPE_SERIES_COUNT);
                  return (
                    <div key={t.type} className={styles.barRow}>
                      <span className={styles.barLabel} title={t.type}>{t.type}</span>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} data-series={series} style={barVars((t.count / typeMax) * 100, i * 55)} />
                      </div>
                      <strong className={styles.barCount} data-series={series}>{t.count}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Label health table ── */}
        {labelStats.length > 0 && (
          <SectionCard title="Label Health & Completion">
            <div id="tour-section-labels-2" className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {['Label', 'Issues', 'Done', 'Completion', 'Critical', 'Warning', 'Points', 'Avg Lead', 'Avg Cycle'].map(label => (
                      <th key={label} className={styles.th}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {labelStats.map((l: any, i: number) => {
                    const prog = Math.min(100, l.completionRate ?? 0);
                    const critical = (l.critical ?? 0) > 0;
                    const warning = (l.warning ?? 0) > 0;
                    return (
                      <tr key={l.label ?? i} className={styles.tableRow}>
                        <td className={styles.cellLabel}>{l.label}</td>
                        <td className={styles.cellMono}>{l.count ?? 0}</td>
                        <td className={styles.cellMono}>{l.done ?? 0}</td>
                        <td className={styles.cellCompletion}>
                          <div className={styles.completionRow}>
                            <div className={styles.completionTrack}>
                              <div className={styles.completionFill} data-good={prog >= 70 || undefined} style={barVars(prog, i * 35)} />
                            </div>
                            <span className={styles.completionPct}>{prog}%</span>
                          </div>
                        </td>
                        <td className={styles.cellFlag} data-active={critical || undefined} data-tone="critical">{l.critical ?? 0}</td>
                        <td className={styles.cellFlag} data-active={warning || undefined} data-tone="warning">{l.warning ?? 0}</td>
                        <td className={styles.cellMono}>{l.storyPoints ?? 0}</td>
                        <td className={styles.cellMono}>{l.averageLeadTimeDays != null ? `${l.averageLeadTimeDays}d` : '—'}</td>
                        <td className={styles.cellMono}>{l.averageCycleTimeDays != null ? `${l.averageCycleTimeDays}d` : '—'}</td>
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
          <div className={styles.gridBreakdown} data-single={!(parents.length > 0 && projects.length > 1) || undefined}>
            {parents.length > 0 && (
              <SectionCard title="Parent Key Breakdown">
                <div className={styles.barList}>
                  {parents.slice(0, 8).map((p: any, i: number) => (
                    <div key={p.parent ?? i} className={styles.barRow}>
                      <span className={clsx(styles.barLabel, styles.barLabelNarrow)} title={p.parent}>{p.parent}</span>
                      <div className={styles.barTrack}>
                        <div className={clsx(styles.barFill, styles.barFillPurple)} style={barVars(((p.count ?? 0) / parentMax) * 100, i * 55)} />
                      </div>
                      <strong className={clsx(styles.barCount, styles.barCountPurple)}>{p.count}</strong>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
            {projects.length > 1 && (
              <SectionCard title="Project Breakdown">
                <div className={styles.barList}>
                  {projects.map((p: any, i: number) => {
                    const projectMax = Math.max(...projects.map((x: any) => x.count ?? 0), 1);
                    return (
                      <div key={p.project ?? i} className={styles.barRow}>
                        <span className={clsx(styles.barLabel, styles.barLabelNarrow)} title={p.project}>{p.project}</span>
                        <div className={styles.barTrack}>
                          <div className={clsx(styles.barFill, styles.barFillCyan)} style={barVars(((p.count ?? 0) / projectMax) * 100, i * 55)} />
                        </div>
                        <strong className={clsx(styles.barCount, styles.barCountCyan)}>{p.count}</strong>
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
