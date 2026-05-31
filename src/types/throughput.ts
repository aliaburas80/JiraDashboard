// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type SprintGoalOutcome = 'Met' | 'Partially Met' | 'Missed' | 'At Risk' | 'Unknown';

export type SprintDeliveryPattern =
  | 'Healthy Early Progress'
  | 'End-Loaded Sprint'
  | 'Scope Instability'
  | 'Blocked Sprint'
  | 'Late Delivery Risk'
  | 'Unknown';

export type TrendDirection = 'Improving' | 'Declining' | 'Stable';

export type KanbanBottleneckStatus = 'None' | 'Mild' | 'Moderate' | 'Severe';
export type KanbanFlowHealth = 'Healthy' | 'At Risk' | 'Degraded';

// ── Sprint-level throughput record ────────────────────────────────────────────
export interface SprintThroughput {
  sprintName: string;
  team: string;
  sprintStart: string | null;   // ISO date string or null if unavailable
  sprintEnd: string | null;
  sprintMidpoint: string | null;

  // Commitment
  committedCount: number;
  committedPoints: number;

  // Completion (by sprint end)
  completedCount: number;
  completedPoints: number;
  completionPct: number;           // 0–100
  pointCompletionPct: number;      // 0–100

  // Throughput (= completed within sprint window)
  throughputByCount: number;
  throughputByPoints: number;

  // Mid-sprint delivery
  midSprintDoneCount: number;
  midSprintDonePoints: number;
  midSprintPct: number;            // % of committed done by midpoint

  // Scope changes
  carryoverCount: number;          // not done by sprint end (moved to next sprint)
  addedScopeCount: number;         // added after sprint start
  removedScopeCount: number;

  // Risk signals
  blockedCount: number;
  bugsCompleted: number;
  bugsOpen: number;

  // Outcomes
  goalOutcome: SprintGoalOutcome;
  deliveryPattern: SprintDeliveryPattern;
  patternInterpretation: string;
  deliveryConfidence: number;      // 0–100
}

// ── Summary across all sprints ────────────────────────────────────────────────
export interface SprintThroughputSummary {
  sprints: SprintThroughput[];
  totalSprints: number;
  totalCommitted: number;
  totalCompleted: number;
  averageThroughputCount: number;
  averageThroughputPoints: number;
  averageCompletionPct: number;
  averageMidSprintPct: number;
  deliveryTrendValue: number;       // positive = improving, negative = declining
  trendDirection: TrendDirection;
  bestSprintName: string;
  worstSprintName: string;
  endLoadedSprintCount: number;
  blockedSprintCount: number;
  overallDeliveryConfidence: number;
}

// ── Single Kanban reporting period ────────────────────────────────────────────
export interface KanbanPeriod {
  team: string;
  periodLabel: string;            // e.g. "May 2025"
  periodStart: string;
  periodEnd: string;
  completedCount: number;
  completedPoints: number;
  avgCycleTimeDays: number;
  avgLeadTimeDays: number;
  wipAverage: number;
  agingWipCount: number;          // items active > 14 days
  blockedCount: number;
  reopenedCount: number;
  throughputTrend: number;        // delta vs previous period
  flowEfficiencyPct: number;      // activeTime / leadTime × 100
  bottleneckStatus: KanbanBottleneckStatus;
  flowHealth: KanbanFlowHealth;
}

// ── Kanban summary across all periods ─────────────────────────────────────────
export interface KanbanFlowSummary {
  hasKanbanData: boolean;
  periods: KanbanPeriod[];
  avgThroughputPerPeriod: number;
  avgCycleTimeDays: number;
  avgLeadTimeDays: number;
  avgFlowEfficiencyPct: number;
  totalAgingWip: number;
  overallFlowHealth: KanbanFlowHealth;
}

// ── Mid-sprint per-sprint insight ─────────────────────────────────────────────
export interface MidSprintInsight {
  sprintName: string;
  team: string;
  sprintMidpoint: string | null;
  midDoneCount: number;
  midDonePoints: number;
  midSprintPct: number;
  finalCompletionPct: number;
  pattern: SprintDeliveryPattern;
  interpretation: string;
  isEndLoaded: boolean;
  isScopeUnstable: boolean;
  isBlocked: boolean;
}

// ── Top-level bundle attached to DashboardMetrics ─────────────────────────────
export interface ThroughputMetrics {
  sprint: SprintThroughputSummary;
  kanban: KanbanFlowSummary;
  midSprint: MidSprintInsight[];
}
