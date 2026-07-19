// @ts-nocheck
'use client';

import { useEffect, useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardMetrics } from '@/components/dashboard/DashboardMetricsContext';
import type { FlowItem } from '@/types/metrics';
import {
  StickyToolbar, ToolbarSpacer,
  PageHeader, SectionCard, PageLoading,
} from '@/components/dashboard/DashboardPageShell';
import styles from './page.module.scss';

// STYLE-03 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token mapping notes. No behavior change.

type CSSVariableProperties = CSSProperties & Record<`--${string}`, string | number>;

function progressTier(prog: number): 'good' | 'warning' | 'critical' {
  if (prog >= 70) return 'good';
  if (prog >= 40) return 'warning';
  return 'critical';
}

export default function EpicReadinessPage() {
  const router = useRouter();
  const { metrics, loading } = useDashboardMetrics();

  useEffect(() => {
    if (!loading && !metrics) router.replace('/');
  }, [loading, metrics, router]);

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

  const kpis = [
    { label: 'Total Epics', value: epicReadiness.length, kpi: undefined },
    { label: 'On Track', value: epicReadiness.filter(e => e.risk === 'good' && e.completion >= 60).length, kpi: 'success' },
    { label: 'Epics Needing Attention', value: epicReadiness.filter(e => e.risk === 'warning').length, kpi: 'warning' },
    { label: 'Critical', value: criticalEpics, kpi: 'critical' },
  ];

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

      <div className={styles.page}>

        {/* ── Epic summary KPIs ── */}
        <div id="tour-section-epic-readiness-1" className={styles.kpiGrid}>
          {kpis.map(({ label, value, kpi }) => (
            <div key={label} className={styles.kpiCard} data-kpi={kpi}>
              <p className={styles.kpiLabel}>{label}</p>
              <p className={styles.kpiValue} data-kpi={kpi}>{value}</p>
            </div>
          ))}
        </div>

        <div className={styles.grid2}>

          {/* ── At-risk epics ── */}
          <SectionCard title="Top At-Risk Epics">
            {atRisk.length === 0 ? (
              <p className={styles.emptyNote}>No at-risk epics detected.</p>
            ) : (
              <div className={styles.epicCardList}>
                {atRisk.slice(0, 8).map((e: any, i: number) => {
                  const prog = Math.min(100, e.completion ?? 0);
                  const tier = progressTier(prog);
                  const barVars: CSSVariableProperties = { '--bar-width': `${prog}%` };
                  return (
                    <div key={e.epic ?? e.id ?? i} className={styles.epicCard}>
                      <div className={styles.epicCardHead}>
                        <span className={styles.epicName}>
                          {e.epic ?? e.id ?? 'Unknown Epic'}
                        </span>
                        <span className={styles.riskBadge} data-risk={e.risk}>
                          {e.risk}
                        </span>
                      </div>
                      <div className={styles.progressRow}>
                        <div className={styles.progressTrack}>
                          <div className={styles.progressFill} data-tier={tier} style={barVars} />
                        </div>
                        <span className={styles.progressPct}>{prog}%</span>
                      </div>
                      <div className={styles.epicMeta}>
                        {e.issues ?? 0} issues · {e.completedIssues ?? e.done ?? 0} done
                        {(e.critical ?? 0) > 0 && <span className={styles.epicMetaCritical}>{e.critical} critical</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* ── Dependency callouts ── */}
          <SectionCard title="Dependency Callouts">
            <p className={styles.dependencyIntro}>Items referencing other epics or external blockers.</p>
            {dependencyItems.length === 0 ? (
              <p className={styles.emptyNote}>No dependency callouts detected.</p>
            ) : (
              <div className={styles.dependencyList}>
                {dependencyItems.slice(0, 12).map((item, i) => (
                  <div key={item.key ?? i} className={styles.dependencyItem}>
                    <span className={styles.dependencyKey}>{item.key}</span>
                    {': '}
                    <span>{item.summary}</span>
                    {(item as any).dependsOn && (
                      <div className={styles.dependencyDetail}>depends on {(item as any).dependsOn}</div>
                    )}
                    {(item as any).externalEpic && (
                      <div className={styles.dependencyDetail}>external epic: {(item as any).externalEpic}</div>
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
            <div id="tour-section-epic-readiness-2" className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    {['Epic / Parent', 'Issues', 'Done', 'Lead (d)', 'Cycle (d)', 'Critical', 'Warning', 'Progress', 'Risk'].map(label => (
                      <th key={label} className={styles.th}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {epicReadiness.map((e: any, i: number) => {
                    const prog = Math.min(100, e.completion ?? 0);
                    const tier = progressTier(prog);
                    const barVars: CSSVariableProperties = { '--bar-width': `${prog}%` };
                    const critical = (e.critical ?? 0) > 0;
                    const warning = (e.warning ?? 0) > 0;
                    return (
                      <tr key={e.epic ?? e.id ?? i} className={styles.tableRow}>
                        <td className={styles.cellEpic}>
                          <span className={styles.ellipsisText}>{e.epic ?? e.id ?? '—'}</span>
                        </td>
                        <td className={styles.cellMono}>{e.issues ?? 0}</td>
                        <td className={styles.cellDone}>{e.completedIssues ?? e.done ?? 0}</td>
                        <td className={styles.cellMono}>{e.averageLeadTimeDays != null ? `${e.averageLeadTimeDays}d` : '—'}</td>
                        <td className={styles.cellMono}>{e.averageCycleTimeDays != null ? `${e.averageCycleTimeDays}d` : '—'}</td>
                        <td className={styles.cellFlag} data-active={critical || undefined} data-tone="critical">{e.critical ?? 0}</td>
                        <td className={styles.cellFlag} data-active={warning || undefined} data-tone="warning">{e.warning ?? 0}</td>
                        <td className={styles.cellProgress}>
                          <div className={styles.progressRow}>
                            <div className={styles.progressTrackWide}>
                              <div className={styles.progressFill} data-tier={tier} style={barVars} />
                            </div>
                            <span className={styles.progressPctSmall}>{prog}%</span>
                          </div>
                        </td>
                        <td className={styles.cellRisk}>
                          <span className={styles.riskLabel} data-risk={e.risk}>
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
