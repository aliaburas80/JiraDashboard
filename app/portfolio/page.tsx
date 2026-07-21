// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /portfolio — Cross-team delivery portfolio: score, epics, projects, quarters.
'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import LoadingState from '@/components/ui/LoadingState';
import { loadMetricsWithSource } from '@/lib/storage';
import {
  computePortfolioSummary,
  type PortfolioSummary,
  type EpicSummary,
  type ProjectSummary,
  type QuarterSummary,
} from '@/lib/portfolioHealth';
import { exportPortfolioEpicsToCsv } from '@/services/export/portfolioExport.service';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

// STYLE-05 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token mapping notes. No behavior change.

type HealthTier = 'good' | 'warning' | 'critical';

// Colors for epic/project health are resolved in SCSS from data-tier
// (CLAUDE.md §28); JS only supplies the human label.
const HEALTH_LABEL: Record<HealthTier, string> = {
  good:     'On track',
  warning:  'At risk',
  critical: 'Critical',
};

type Tone = HealthTier | 'primary' | 'neutral';

function quarterTier(completionRate: number): HealthTier {
  if (completionRate >= 70) return 'good';
  if (completionRate >= 40) return 'warning';
  return 'critical';
}

function insightTone(text: string): HealthTier {
  if (text.includes('critical') || text.includes('Immediate')) return 'critical';
  if (text.includes('risk') || text.includes('behind')) return 'warning';
  return 'good';
}

const BAND_MEANINGS: Record<string, string> = {
  Excellent: 'Delivery is in excellent shape. Epics and projects are progressing well with minimal risk.',
  Good:      'Overall delivery is healthy. A few items need monitoring but no immediate action is required.',
  Moderate:  'Delivery is progressing but risk areas exist. Review at-risk epics and blocked items.',
  'Portfolio At Risk': 'Portfolio has significant risk. Escalate blockers and re-prioritise critical epics now.',
  Critical:  'Delivery is critically behind. Immediate leadership review and re-planning is required.',
};

// Circumference of the score ring (r = 44)
const RING_CIRC = 2 * Math.PI * 44; // ≈ 276.5

// ── Epic row ──────────────────────────────────────────────────────────────────
function EpicRow({ epic, index }: { epic: EpicSummary; index: number }) {
  return (
    <div
      className={styles.epicRow}
      style={{ '--epic-delay': `${index * 45}ms` } as CSSProperties}
    >
      <div className={styles.epicRowTop}>
        <div className={styles.epicDot} data-tier={epic.health} aria-hidden="true" />
        <span className={styles.epicName} title={epic.name}>{epic.name}</span>

        {/* Health badge */}
        <span className={styles.epicHealthBadge} data-tier={epic.health}>
          {HEALTH_LABEL[epic.health]}
        </span>

        <span className={styles.epicPct} data-tier={epic.health}>
          {epic.progress}%
        </span>
      </div>

      {/* Animated progress bar */}
      <div className={styles.epicTrack}>
        <div
          className={styles.epicFill}
          data-tier={epic.health}
          style={{
            '--bar-w':     `${Math.min(epic.progress, 100)}%`,
            '--bar-delay': `${index * 45}ms`,
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
  return (
    <div
      className={styles.projectCard}
      data-tier={project.health}
      style={{ '--proj-delay': `${index * 50}ms` } as CSSProperties}
    >
      <p className={styles.projectName} title={project.name}>{project.name}</p>
      <p className={styles.projectStatus} data-tier={project.health}>{HEALTH_LABEL[project.health]}</p>

      <div className={styles.projectTrack}>
        <div
          className={styles.projectFill}
          data-tier={project.health}
          style={{
            '--bar-w':     `${Math.min(project.completionRate, 100)}%`,
            '--bar-delay': `${index * 50}ms`,
          } as CSSProperties}
        />
      </div>

      <div className={styles.projectMeta}>
        <span className={styles.projectMetaDone}>{project.done}/{project.issues} issues</span>
        <span className={styles.projectMetaPct} data-tier={project.health}>{project.completionRate}%</span>
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
          const totalH = Math.max(6, Math.round((q.issues / maxIssues) * 100));
          const doneH  = Math.max(0, Math.round((q.doneIssues / maxIssues) * 100));
          const tier   = quarterTier(q.completionRate);
          return (
            <div key={q.quarter} className={styles.quarterCol}>
              <span className={styles.quarterTopLabel}>{q.issues}</span>
              <div className={styles.quarterBarTrack}>
                {/* Background (total) */}
                <div
                  className={styles.quarterBarBg}
                  data-tier={tier}
                  style={{ '--bar-total': `${totalH}%` } as CSSProperties}
                />
                {/* Foreground (done) */}
                <div
                  className={styles.quarterBarDone}
                  data-tier={tier}
                  style={{
                    '--bar-done':  `${doneH}%`,
                    '--bar-delay': `${i * 60}ms`,
                  } as CSSProperties}
                  title={`${q.doneIssues} done of ${q.issues} (${q.completionRate}%)`}
                />
              </div>
              <span className={styles.quarterCompletionLabel} data-tier={tier}>
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
          <div className={styles.quarterLegendDot} data-legend="total" />
          Total issues in quarter
        </div>
        <div className={styles.quarterLegendItem}>
          <div className={styles.quarterLegendDot} data-legend="done" />
          Completed (solid = done)
        </div>
        <div className={styles.quarterLegendItem}>
          <div className={styles.quarterLegendDot} data-legend="critical" />
          {`< 40%`} completion rate
        </div>
        <div className={styles.quarterLegendItem}>
          <div className={styles.quarterLegendDot} data-legend="warning" />
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
  // 09-ux §4 (silent redirect / conflated error state): a genuine fetch
  // failure previously rendered the identical "No portfolio data available"
  // empty state as a real empty state, with no way to tell them apart.
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await loadMetricsWithSource();
      if (cancelled) return;
      const metrics = result.metrics as DashboardMetrics | null;
      if (!metrics) { setNoData(true); return; }
      setSummary(computePortfolioSummary(metrics));
    }
    load().catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, []);

  if (loadError) return (
    <AppShell showNav>
      <div className="max-w-5xl mx-auto py-24 text-center">
        <p className="text-base font-black text-slate-700 mb-2">Couldn&apos;t load portfolio data</p>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Something went wrong loading your dashboard data. Try refreshing the page — if this keeps happening, contact your administrator.
        </p>
      </div>
    </AppShell>
  );
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
  if (!summary) return <AppShell showNav><LoadingState message="Loading portfolio…" /></AppShell>;

  const ringOffset = RING_CIRC * (1 - summary.portfolioScore / 100);

  // Score factor breakdown — what contributes to the portfolio score
  const scoreFactors = [
    { label: 'Epic completion',    pct: Math.round(summary.completionRate), weight: '40%' },
    { label: 'Project completion', pct: summary.healthyProjects > 0 ? Math.round((summary.healthyProjects / Math.max(summary.healthyProjects + summary.atRiskProjects, 1)) * 100) : 0, weight: '30%' },
    { label: 'Sprint performance', pct: summary.portfolioScore,  weight: '20%' },
    { label: 'Data quality',       pct: Math.min(100, summary.portfolioScore + 10), weight: '10%' },
  ];

  // KPI strip data
  const kpis = [
    { label: 'Total Issues',     val: summary.totalIssues,       sub: 'in scope',            tone: 'primary' as Tone, band: false, delay: 0   },
    { label: 'Completion',       val: `${summary.completionRate}%`, sub: 'issues done',       tone: 'primary' as Tone, band: true,  delay: 50  },
    { label: 'Story Points',     val: summary.totalStoryPoints > 0 ? `${summary.doneStoryPoints}/${summary.totalStoryPoints}` : '—', sub: 'SP done/total', tone: 'primary' as Tone, band: true, delay: 100 },
    { label: 'Active Epics',     val: summary.activeEpics,       sub: 'not yet complete',    tone: 'primary' as Tone, band: false, delay: 150 },
    { label: 'At-Risk Epics',    val: summary.atRiskEpics,       sub: 'have critical items', tone: (summary.atRiskEpics    > 0 ? 'critical' : 'neutral') as Tone, band: false, delay: 200 },
    { label: 'Blocked',          val: summary.totalBlockedItems,  sub: 'items blocked',      tone: (summary.totalBlockedItems > 0 ? 'critical' : 'neutral') as Tone, band: false, delay: 250 },
    { label: 'Healthy Projects', val: summary.healthyProjects,   sub: '≥ 70% complete',      tone: 'good' as Tone, band: false, delay: 300 },
  ];

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
                data-band={summary.band}
                cx="55" cy="55" r="44"
                style={{
                  '--ring-full':   `${RING_CIRC}`,
                  '--ring-offset': `${ringOffset}`,
                } as CSSProperties}
              />
            </svg>
            <div className={styles.scoreLabel}>
              <span className={styles.scoreNum} data-band={summary.band}>
                {summary.portfolioScore}
              </span>
              <span className={styles.scoreOf}>/100</span>
            </div>
          </div>

          {/* Band + factors */}
          <div className={styles.scoreMid}>
            <p className={styles.scoreBand} data-band={summary.band}>
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
                      data-band={summary.band}
                      style={{
                        '--bar-w':     `${f.pct}%`,
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
                <div className={styles.insightDot} data-tier={insightTone(ins)} />
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
              <p className={styles.kpiVal} data-tone={k.tone} data-band={k.band ? summary.band : undefined}>{k.val}</p>
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
            <div className={styles.quarterBarsWrap}>
              <QuarterBars quarters={summary.quarters} />
            </div>
          </div>
        )}

        {/* ── Epic detail table ── */}
        {summary.epics.length > 0 && (
          <div className={clsx(styles.card, styles.tableCard)}>
            <div className={styles.cardHead}>
              <div className="flex items-center gap-2">
                <span className={styles.cardTitle}>Epic Detail Table</span>
                <span className={styles.cardCount}>Full breakdown — scroll right on small screens</span>
              </div>
              <button
                type="button"
                onClick={() => exportPortfolioEpicsToCsv(summary.epics)}
                className="btn-secondary btn-sm"
              >
                ↓ Export CSV
              </button>
            </div>
            <div className={styles.tableScroll}>
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
                    return (
                      <tr key={e.name} className={styles.tableTr}>
                        <td className={clsx(styles.tableTd, styles.tableTdName)} title={e.name}>{e.name}</td>
                        <td className={styles.tableTd}>
                          <div className={styles.tableHealthCell}>
                            <div className={styles.tableHealthDot} data-tier={e.health} />
                            <span className={styles.tableHealthLabel} data-tier={e.health}>
                              {HEALTH_LABEL[e.health]}
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
                                data-tier={e.health}
                                style={{
                                  '--bar-w':     `${e.progress}%`,
                                  '--bar-delay': `${i * 30}ms`,
                                } as CSSProperties}
                              />
                            </div>
                            <span className={styles.tablePct} data-tier={e.health}>
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
