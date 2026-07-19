// @ts-nocheck
'use client';

import { useEffect, useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import {
  StickyToolbar, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';
import styles from './page.module.scss';

// STYLE-03 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token mapping notes. No behavior change.

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

export default function OwnershipCapacityPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboardMetrics();

  useEffect(() => {
    if (!loading && !metrics) router.replace('/');
  }, [loading, metrics, router]);

  const capacity = useMemo(() => (metrics?.capacity ?? []) as any[], [metrics]);

  if (loading) return <PageLoading />;
  if (!metrics) return null;

  const capMax = Math.max(...capacity.map((c: any) => c.issues ?? 0), 1);

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

      <div className={styles.page}>

        {/* ── Capacity bar chart ── */}
        <SectionCard title="Capacity by Assignee">
          {capacity.length === 0 ? (
            <p className={styles.emptyNote}>No assignee data found.</p>
          ) : (
            <div id="tour-section-ownership-1" className={styles.barList}>
              {capacity.slice(0, 10).map((c: any, idx: number) => {
                const pct = Math.round(((c.issues ?? 0) / capMax) * 100);
                const skewed = (c.loadShare ?? 0) > 35;
                const barVars: CSSVariableProperties = { '--bar-width': `${pct}%`, '--bar-delay': `${idx * 60}ms` };
                return (
                  <div key={c.assignee} className={styles.barRow}>
                    <span className={styles.barLabel} title={c.assignee}>{c.assignee}</span>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} data-skewed={skewed || undefined} style={barVars} />
                    </div>
                    <span className={styles.barMeta} data-skewed={skewed || undefined}>
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
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {['Assignee', 'Issues', 'Active', 'Points', 'Load %'].map(label => (
                      <th key={label} className={styles.th}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {capacity.map((c: any, i: number) => {
                    const skewed = (c.loadShare ?? 0) > 35;
                    return (
                      <tr key={c.assignee ?? i} className={styles.tableRow}>
                        <td className={styles.cell}>{c.assignee ?? '—'}</td>
                        <td className={styles.cellMono}>{c.issues ?? 0}</td>
                        <td className={styles.cellMono}>{c.activeIssues ?? 0}</td>
                        <td className={styles.cellMono}>{c.storyPoints ?? 0}</td>
                        <td className={styles.cellLoad} data-skewed={skewed || undefined}>{c.loadShare ?? 0}%</td>
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
