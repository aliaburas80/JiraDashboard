// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Cross-team portfolio summary — 9.32
// Aggregates epics, projects, sprints, and quarters into a single
// portfolio-level health picture.
//
// Portfolio score (0-100):
//   40 pts — epic completion   (weighted avg of epic.progress)
//   30 pts — project completion (weighted avg of project.completionRate)
//   20 pts — sprint performance (avg sprint completion %)
//   10 pts — data quality       (metrics.dataQuality.score / 100)

import type { DashboardMetrics } from '@/types/metrics';

export type PortfolioBand = 'Excellent' | 'Good' | 'Moderate' | 'At Risk' | 'Critical';

export interface EpicSummary {
  name:           string;
  issues:         number;
  completedIssues: number;
  storyPoints:    number;
  doneStoryPoints: number;
  progress:       number;   // 0-100 %
  pointProgress:  number;   // 0-100 %
  critical:       number;
  warning:        number;
  good:           number;
  health:         'good' | 'warning' | 'critical';
}

export interface ProjectSummary {
  name:           string;
  issues:         number;
  done:           number;
  completionRate: number;   // 0-100 %
  storyPoints:    number;
  health:         'good' | 'warning' | 'critical';
}

export interface QuarterSummary {
  quarter:        string;
  issues:         number;
  doneIssues:     number;
  completionRate: number;
}

export interface PortfolioSummary {
  portfolioScore:      number;          // 0-100
  band:                PortfolioBand;
  totalIssues:         number;
  completionRate:      number;
  activeEpics:         number;          // epics not yet 100% done
  atRiskEpics:         number;          // epics with critical items
  healthyProjects:     number;
  atRiskProjects:      number;
  totalBlockedItems:   number;
  totalCriticalItems:  number;
  totalStoryPoints:    number;
  doneStoryPoints:     number;
  epics:               EpicSummary[];
  projects:            ProjectSummary[];
  quarters:            QuarterSummary[];
  insights:            string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function weightedAvg(entries: { value: number; weight: number }[]): number {
  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  if (totalWeight === 0) return 0;
  return entries.reduce((s, e) => s + e.value * e.weight, 0) / totalWeight;
}

function epicHealth(e: any): 'good' | 'warning' | 'critical' {
  if ((e.critical ?? 0) > 0) return 'critical';
  if ((e.warning  ?? 0) > 0) return 'warning';
  return 'good';
}

function projectHealth(p: any): 'good' | 'warning' | 'critical' {
  const rate = p.completionRate ?? 0;
  if (rate >= 70) return 'good';
  if (rate >= 40) return 'warning';
  return 'critical';
}

export function portfolioBand(score: number): PortfolioBand {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Moderate';
  if (score >= 35) return 'At Risk';
  return 'Critical';
}

export function portfolioBandColor(band: PortfolioBand): string {
  const map: Record<PortfolioBand, string> = {
    Excellent: '#16a34a',
    Good:      '#0d9488',
    Moderate:  '#f59e0b',
    'At Risk': '#ea580c',
    Critical:  '#dc2626',
  };
  return map[band];
}

// ── Main compute function ─────────────────────────────────────────────────────

export function computePortfolioSummary(metrics: DashboardMetrics): PortfolioSummary {
  const rawEpics    = (metrics.epics    ?? []) as any[];
  const rawProjects = (metrics.projects ?? []) as any[];
  const rawQuarters = (metrics.quarters ?? []) as any[];
  const flow        = (metrics.flow     ?? {}) as any;
  const sprint      = metrics.throughput?.sprint;

  // ── Epics ────────────────────────────────────────────────────────────────
  const epics: EpicSummary[] = rawEpics.map(e => ({
    name:            e.epic || e.name || '(no epic)',
    issues:          e.issues          ?? 0,
    completedIssues: e.completedIssues ?? 0,
    storyPoints:     e.storyPoints     ?? 0,
    doneStoryPoints: e.doneStoryPoints ?? 0,
    progress:        e.progress        ?? 0,
    pointProgress:   e.pointProgress   ?? 0,
    critical:        e.critical        ?? 0,
    warning:         e.warning         ?? 0,
    good:            e.good            ?? 0,
    health:          epicHealth(e),
  }));

  // ── Projects ─────────────────────────────────────────────────────────────
  const projects: ProjectSummary[] = rawProjects.map(p => ({
    name:           p.project        || p.name || '(no project)',
    issues:         p.count          ?? p.issues ?? 0,
    done:           p.done           ?? 0,
    completionRate: p.completionRate ?? 0,
    storyPoints:    p.storyPoints    ?? 0,
    health:         projectHealth(p),
  }));

  // ── Quarters ─────────────────────────────────────────────────────────────
  const quarters: QuarterSummary[] = rawQuarters
    .filter((q: any) => q.quarter !== 'No date')
    .map((q: any) => ({
      quarter:        q.quarter,
      issues:         q.issues         ?? 0,
      doneIssues:     q.doneIssues     ?? 0,
      completionRate: q.completionRate ?? 0,
    }));

  // ── Portfolio score ───────────────────────────────────────────────────────
  const epicAvgCompletion = epics.length
    ? weightedAvg(epics.map(e => ({ value: e.progress, weight: Math.max(e.issues, 1) })))
    : metrics.completionRate;

  const projectAvgCompletion = projects.length
    ? weightedAvg(projects.map(p => ({ value: p.completionRate, weight: Math.max(p.issues, 1) })))
    : metrics.completionRate;

  const sprintAvgCompletion = sprint?.averageCompletionPct ?? metrics.completionRate;
  const dataQualityPct      = metrics.dataQuality?.score   ?? 70;

  const portfolioScore = Math.round(Math.max(0, Math.min(100,
    epicAvgCompletion    * 0.40 +
    projectAvgCompletion * 0.30 +
    sprintAvgCompletion  * 0.20 +
    dataQualityPct       * 0.10,
  )));

  // ── Aggregates ────────────────────────────────────────────────────────────
  const activeEpics       = epics.filter(e => e.progress < 100).length;
  const atRiskEpics       = epics.filter(e => e.health === 'critical').length;
  const healthyProjects   = projects.filter(p => p.health === 'good').length;
  const atRiskProjects    = projects.filter(p => p.health !== 'good').length;
  const totalBlockedItems = metrics.blockedIssues ?? 0;
  const totalCriticalItems= flow.critical         ?? 0;

  // ── Insights ──────────────────────────────────────────────────────────────
  const insights: string[] = [];
  if (atRiskEpics > 0)
    insights.push(`${atRiskEpics} epic${atRiskEpics > 1 ? 's have' : ' has'} critical items that need immediate attention.`);
  if (atRiskProjects > 0)
    insights.push(`${atRiskProjects} project${atRiskProjects > 1 ? 's are' : ' is'} behind — completion below 70%.`);
  if (totalBlockedItems > 0)
    insights.push(`${totalBlockedItems} blocked item${totalBlockedItems > 1 ? 's' : ''} across the portfolio. Resolve to unblock delivery.`);
  if (portfolioScore >= 80)
    insights.push('Portfolio is in a strong position. Focus on clearing the remaining blockers.');
  else if (portfolioScore >= 55)
    insights.push('Portfolio is progressing but has risk areas. Prioritise unblocking critical epics.');
  else
    insights.push('Portfolio is at risk. Immediate action needed on blocked and critical items.');

  return {
    portfolioScore,
    band: portfolioBand(portfolioScore),
    totalIssues:       metrics.totalIssues      ?? 0,
    completionRate:    metrics.completionRate    ?? 0,
    activeEpics,
    atRiskEpics,
    healthyProjects,
    atRiskProjects,
    totalBlockedItems,
    totalCriticalItems,
    totalStoryPoints:  metrics.storyPoints?.totalStoryPoints     ?? 0,
    doneStoryPoints:   metrics.storyPoints?.completedStoryPoints ?? 0,
    epics,
    projects,
    quarters,
    insights,
  };
}
