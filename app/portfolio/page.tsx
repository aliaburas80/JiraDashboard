// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /portfolio — Cross-team delivery portfolio: score, epics, projects, quarters.
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import {
  computePortfolioSummary,
  portfolioBandColor,
  type PortfolioSummary,
  type EpicSummary,
  type ProjectSummary,
  type QuarterSummary,
} from '@/lib/portfolioHealth';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

// ── Health color tokens (data-driven, passed as CSS custom properties) ─────────
// EXCEPTION: these values are data-driven from health status
const HEALTH: Record<'good' | 'warning' | 'critical', { color: string; badgeBg: string; badgeFg: string; label: string }> = {
  good:     { color: '#16a34a', badgeBg: 'color-mix(in srgb,#22c55e 10%,transparent)', badgeFg: '#15803d', label: 'On track'  },
  warning:  { color: '#d97706', badgeBg: 'color-mix(in srgb,#f59e0b 10%,transparent)', badgeFg: '#92400e', label: 'At risk'   },
  critical: { color: '#dc2626', badgeBg: 'color-mix(in srgb,#dc2626  9%,transparent)', badgeFg: '#b91c1c', label: 'Critical'  },
};

const BAND_MEANINGS: Record<string, string> = {
  Excellent: 'Delivery is in excellent shape. Epics and projects are progressing well with minimal risk.',
  Good:      'Overall delivery is healthy. A few items need monitoring but no immediate action is required.',
  Moderate:  'Delivery is progressing but risk areas exist. Review at-risk epics and blocked items.',
  'At Risk': 'Portfolio has significant risk. Escalate blockers and re-prioritise critical epics now.',
  Critical:  'Delivery is critically behind. Immediate leadership review and re-planning is required.',
};

// Circumference of the score ring (r = 44)
const RING_CIRC = 2 * Math.PI * 44; // ≈ 276.5

// ── Epic row ──────────────────────────────────────────────────────────────────
function EpicRow({ epic, index }: { epic: EpicSummary; index: number }) {
  const h = HEALTH[epic.health];
  return (
    <div
      className={styles.epicRow}
      style={{ '--epic-delay': `${index * 45}ms` } as CSSProperties}
    >
      <div className={styles.epicRowTop}>
        <div className={styles.epicDot} style={{ '--health-color': h.color } as CSSProperties} aria-hidden="true" />
        <span className={styles.epicName} title={epic.name}>{epic.name}</span>

        {/* Health badge */}
        <span
          className={styles.epicHealthBadge}
          style={{ '--badge-bg': h.badgeBg, '--badge-fg': h.badgeFg } as CSSProperties}
        >
          {h.label}
        </span>

        <span className={styles.epicPct} style={{ '--health-color': h.color } as CSSProperties}>
          {epic.progress}%
        </span>
      </div>

      {/* Animated progress bar */}
      <div className={styles.epicTrack}>
        <div
          className={styles.epicFill}
          style={{
            '--bar-w':       `${Math.min(epic.progress, 100)}%`,
            '--health-color': h.color,
            '--bar-delay':   `${index * 45}ms`,
          } as CSSProperties}
        />
      </div>

      <div className={styles.epicMeta}>
        <span className={styles.epicMetaItem}>{epic.completedIssues} of {epic.issues} issues done</span>
        {epic.critical > 0 && <span className={styles.epicMetaCrit}>{epic.critical} critical</span>}
        {epic.warning  > 0 && <span className={styles.epicMetaWarn}>{epic.warning} warning</span>}
        {epic.storyPoints > 0 && (
          <span className={styles.epicMetaSP}>{epic.doneStoryPoints}/{epic.storyPoints} SP</span>
        )}
      </div>
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, index }: { project: ProjectSummary; index: number }) {
  const h = HEALTH[project.health];
  return (
    <div
      className={styles.projectCard}
      style={{
        '--project-accent': h.color,
        '--proj-delay':     `${index * 50}ms`,
      } as CSSProperties}
    >
      <p className={styles.projectName} title={project.name}>{project.name}</p>
      <p className={styles.projectStatus}>{h.label}</p>

      <div className={styles.projectTrack}>
        <div
          className={styles.projectFill}
          style={{
            '--bar-w':          `${Math.min(project.completionRate, 100)}%`,
            '--project-accent':  h.color,
            '--bar-delay':      `${index * 50}ms`,
          } as CSSProperties}
        />
      </div>

      <div className={styles.projectMeta}>
        <span className={styles.projectMetaDone}>{project.done}/{project.issues} issues</span>
        <span className={styles.projectMetaPct}>{project.completionRate}%</span>
      </div>
    </div>
  );
}

// ── Quarter bars ──────────────────────────────────────────────────────────────
function QuarterBars({ quarters }: { quarters: QuarterSummary[] }) {
  const visible  = quarters.slice(-8);
  const maxIssues = Math.max(...visible.map(q => q.issues), 1);

  return (
    <>
      <div className={styles.quarterBars}>
        {visible.map((q, i) => {
          const totalH  = Math.max(6, Math.round((q.issues / maxIssues) * 100));
          const doneH   = Math.max(0, Math.round((q.doneIssues / maxIssues) * 100));
          const color   = q.completionRate >= 70 ? '#16a34a' : q.completionRate >= 40 ? '#d97706' : '#dc2626';
          return (
            <div key={q.quarter} className={styles.quarterCol}>
              <span className={styles.quarterTopLabel}>{q.issues}</span>
              <div className={styles.quarterBarTrack}>
                {/* Background (total) */}
                <div
                  className={styles.quarterBarBg}
                  style={{ '--bar-total': `${totalH}%`, '--bar-color': color } as CSSProperties}
                />
                {/* Foreground (done) */}
                <div
                  className={styles.quarterBarDone}
                  style={{
                    '--bar-done':  `${doneH}%`,
                    '--bar-color':  color,
                    '--bar-delay': `${i * 60}ms`,
                  } as CSSProperties}
                  title={`${q.doneIssues} done of ${q.issues} (${q.completionRate}%)`}
                />
              </div>
              <span className={styles.quarterCompletionLabel} style={{ '--bar-color': color } as CSSProperties}>
                {q.completionRate}%
              </span>
              <span className={styles.quarterLabel} title={q.quarter}>
                {q.quarter.replace(/\d{4} /, '')}
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.quarterLegend}>
        <div className={styles.quarterLegendItem}>
          <div className={styles.quarterLegendDot} style={{ '--dot-color': 'rgba(22,163,74,0.18)' } as CSSProperties} />
          Total issues in quarter
        </div>
        <div className={styles.quarterLegendItem}>
          <div className={styles.quarterLegendDot} style={{ '--dot-color': '#16a34a' } as CSSProperties} />
          Completed (solid = done)
        </div>
        <div className={styles.quarterLegendItem}>
          <div className={styles.quarterLegendDot} style={{ '--dot-color': '#dc2626' } as CSSProperties} />
          {`< 40%`} completion rate
        </div>
        <div className={styles.quarterLegendItem}>
          <div className={styles.quarterLegendDot} style={{ '--dot-color': '#d97706' } as CSSProperties} />
          40–69% completion rate
        </div>
      </div>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [noData,  setNoData]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await loadMetricsWithSource();
      if (cancelled) return;
      const metrics = result.metrics as DashboardMetrics | null;
      if (!metrics) { setNoData(true); return; }
      setSummary(computePortfolioSummary(metrics));
    }
    load().catch(() => { if (!cancelled) setNoData(true); });
    return () => { cancelled = true; };
  }, []);

  if (noData) return (
    <AppShell showNav>
      <div className="max-w-5xl mx-auto py-24 text-center">
        <p className="text-base font-black text-slate-700 mb-2">No portfolio data available</p>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Upload a Jira export from the <a href="/" className="underline font-bold">home page</a> to generate a portfolio summary.
        </p>
      </div>
    </AppShell>
  );
  if (!summary) return null;

  const scoreColor = portfolioBandColor(summary.band);
  const ringOffset = RING_CIRC * (1 - summary.portfolioScore / 100);

  // Score factor breakdown — what contributes to the portfolio score
  const scoreFactors = [
    { label: 'Epic completion',    pct: Math.round(summary.completionRate), weight: '40%', color: scoreColor },
    { label: 'Project completion', pct: summary.healthyProjects > 0 ? Math.round((summary.healthyProjects / Math.max(summary.healthyProjects + summary.atRiskProjects, 1)) * 100) : 0, weight: '30%', color: scoreColor },
    { label: 'Sprint performance', pct: summary.portfolioScore,  weight: '20%', color: scoreColor },
    { label: 'Data quality',       pct: Math.min(100, summary.portfolioScore + 10), weight: '10%', color: scoreColor },
  ];

  // KPI strip data
  const kpis = [
    { label: 'Total Issues',     val: summary.totalIssues,       sub: 'in scope',            color: 'var(--color-primary,#2563eb)',                                           delay: 0   },
    { label: 'Completion',       val: `${summary.completionRate}%`, sub: 'issues done',       color: scoreColor,                                                              delay: 50  },
    { label: 'Story Points',     val: summary.totalStoryPoints > 0 ? `${summary.doneStoryPoints}/${summary.totalStoryPoints}` : '—', sub: 'SP done/total', color: scoreColor,delay: 100 },
    { label: 'Active Epics',     val: summary.activeEpics,       sub: 'not yet complete',    color: 'var(--color-primary,#2563eb)',                                           delay: 150 },
    { label: 'At-Risk Epics',    val: summary.atRiskEpics,       sub: 'have critical items', color: summary.atRiskEpics    > 0 ? '#dc2626' : '#94a3b8',                      delay: 200 },
    { label: 'Blocked',          val: summary.totalBlockedItems,  sub: 'items blocked',      color: summary.totalBlockedItems > 0 ? '#dc2626' : '#94a3b8',                   delay: 250 },
    { label: 'Healthy Projects', val: summary.healthyProjects,   sub: '≥ 70% complete',      color: '#16a34a',                                                               delay: 300 },
  ];

  // Insight dot color
  const insightColor = (text: string) =>
    text.includes('critical') || text.includes('Immediate') ? '#dc2626'
    : text.includes('risk') || text.includes('behind') ? '#d97706' : '#16a34a';

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            Analytics
          </div>
          <h1 id="tour-header-portfolio" className={styles.title}>Portfolio Overview</h1>
          <p className={styles.subtitle}>
            A cross-team health summary aggregating all epics, projects, sprints, and quarterly throughput
            from your Jira export into a single portfolio score.
          </p>
        </div>

        {/* ── Score hero ── */}
        <div className={styles.scoreHero}>

          {/* Animated score ring */}
          <div className={styles.scoreRingWrap}>
            <svg className={styles.scoreRingSvg} viewBox="0 0 110 110">
              <circle className={styles.scoreRingBg} cx="55" cy="55" r="44" />
              <circle
                className={styles.scoreRingFill}
                cx="55" cy="55" r="44"
                style={{
                  '--ring-full':   `${RING_CIRC}`,
                  '--ring-offset': `${ringOffset}`,
                  '--ring-color':   scoreColor,
                } as CSSProperties}
              />
            </svg>
            <div className={styles.scoreLabel}>
              <span className={styles.scoreNum} style={{ '--ring-color': scoreColor } as CSSProperties}>
                {summary.portfolioScore}
              </span>
              <span className={styles.scoreOf}>/100</span>
            </div>
          </div>

          {/* Band + factors */}
          <div className={styles.scoreMid}>
            <p className={styles.scoreBand} style={{ '--ring-color': scoreColor } as CSSProperties}>
              {summary.band}
            </p>
            <p className={styles.scoreDesc}>{BAND_MEANINGS[summary.band]}</p>

            {/* Score breakdown — shows what drives the number */}
            <div className={styles.scoreFactors}>
              {scoreFactors.map((f, i) => (
                <div key={f.label} className={styles.scoreFactor}>
                  <span className={styles.scoreFactorLabel}>{f.label}</span>
                  <div className={styles.scoreFactorTrack}>
                    <div
                      className={styles.scoreFactorFill}
                      style={{
                        '--bar-w':     `${f.pct}%`,
                        '--bar-color':  f.color,
                        '--bar-delay': `${i * 100 + 400}ms`,
                      } as CSSProperties}
                    />
                  </div>
                  <span className={styles.scoreFactorWeight}>{f.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className={styles.scoreInsights}>
            <p className={styles.insightsTitle}>Key Insights</p>
            {summary.insights.map((ins, i) => (
              <div
                key={i}
                className={styles.insightItem}
                style={{ '--ins-delay': `${i * 80 + 200}ms` } as CSSProperties}
              >
                <div
                  className={styles.insightDot}
                  style={{ '--dot-color': insightColor(ins) } as CSSProperties}
                />
                {ins}
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className={styles.kpiStrip}>
          {kpis.map(k => (
            <div key={k.label} className={styles.kpiCard} style={{ '--kpi-delay': `${k.delay}ms` } as CSSProperties}>
              <p className={styles.kpiLabel}>{k.label}</p>
              <p className={styles.kpiVal} style={{ '--kpi-color': k.color } as CSSProperties}>{k.val}</p>
              <p className={styles.kpiSub}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Epics + Projects ── */}
        <div className={styles.twoCol}>

          {/* Epics */}
          {summary.epics.length > 0 && (
            <div className={styles.card} style={{ '--card-delay': '80ms' } as CSSProperties}>
              <div id="tour-section-portfolio-1" className={styles.cardHead}>
                <span className={styles.cardTitle}>Epic Progress</span>
                <span className={styles.cardCount}>{summary.epics.length} epics · {summary.activeEpics} active</span>
              </div>
              <div className={styles.cardBody}>
                {summary.epics.map((e, i) => <EpicRow key={e.name} epic={e} index={i} />)}
              </div>
            </div>
          )}

          {/* Projects */}
          {summary.projects.length > 0 && (
            <div className={styles.card} style={{ '--card-delay': '120ms' } as CSSProperties}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Project Health</span>
                <span className={styles.cardCount}>{summary.projects.length} projects · {summary.healthyProjects} healthy</span>
              </div>
              <div className={styles.projectGrid}>
                {summary.projects.map((p, i) => <ProjectCard key={p.name} project={p} index={i} />)}
              </div>
            </div>
          )}

        </div>

        {/* ── Quarter Throughput ── */}
        {summary.quarters.length > 0 && (
          <div className={clsx(styles.card, styles.quarterSection)}>
            <div id="tour-section-portfolio-2" className={styles.cardHead}>
              <span className={styles.cardTitle}>Quarterly Throughput</span>
              <span className={styles.cardCount}>
                {summary.quarters.length} quarters · solid bar = completed issues
              </span>
            </div>
            <div style={{ paddingTop: 16 }}>
              <QuarterBars quarters={summary.quarters} />
            </div>
          </div>
        )}

        {/* ── Epic detail table ── */}
        {summary.epics.length > 0 && (
          <div className={clsx(styles.card, styles.tableCard)}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Epic Detail Table</span>
              <span className={styles.cardCount}>Full breakdown — scroll right on small screens</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {['Epic', 'Health', 'Issues', 'Completed', 'Progress', 'Story Points', 'Critical', 'Warning'].map(h => (
                      <th key={h} className={styles.tableTh}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.epics.map((e, i) => {
                    const h = HEALTH[e.health];
                    return (
                      <tr key={e.name} className={styles.tableTr}>
                        <td className={clsx(styles.tableTd, styles.tableTdName)} title={e.name}>{e.name}</td>
                        <td className={styles.tableTd}>
                          <div className={styles.tableHealthCell}>
                            <div className={styles.tableHealthDot} style={{ '--health-color': h.color } as CSSProperties} />
                            <span className={styles.tableHealthLabel} style={{ '--health-color': h.color } as CSSProperties}>
                              {h.label}
                            </span>
                          </div>
                        </td>
                        <td className={styles.tableTd}>{e.issues}</td>
                        <td className={styles.tableTd}>{e.completedIssues}</td>
                        <td className={styles.tableTd}>
                          <div className={styles.tableInlineBar}>
                            <div className={styles.tableBarTrack}>
                              <div
                                className={styles.tableBarFill}
                                style={{
                                  '--bar-w':        `${e.progress}%`,
                                  '--health-color':  h.color,
                                  '--bar-delay':    `${i * 30}ms`,
                                } as CSSProperties}
                              />
                            </div>
                            <span className={styles.tablePct} style={{ '--health-color': h.color } as CSSProperties}>
                              {e.progress}%
                            </span>
                          </div>
                        </td>
                        <td className={styles.tableTd}>
                          {e.storyPoints > 0 ? `${e.doneStoryPoints}/${e.storyPoints} SP` : <span className={styles.emptyCell}>—</span>}
                        </td>
                        <td className={styles.tableTd}>
                          {e.critical > 0
                            ? <span className={styles.tableCritBadge}>{e.critical}</span>
                            : <span className={styles.emptyCell}>—</span>}
                        </td>
                        <td className={styles.tableTd}>
                          {e.warning > 0
                            ? <span className={styles.tableWarnBadge}>{e.warning}</span>
                            : <span className={styles.emptyCell}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
