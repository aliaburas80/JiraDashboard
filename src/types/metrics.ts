// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type HealthStatus = 'good' | 'warning' | 'critical';

export interface FlowItem {
  key: string;
  summary: string;
  type: string;
  status: string;
  highLevelStatus: string;
  sprint: string;
  epic: string;
  isOrphan: boolean;
  assignee: string;
  priority: string;
  storyPoints: number;
  createdDate: string;
  startedDate: string;
  doneDate: string;
  leadTimeDays: number | null;
  cycleTimeDays: number | null;
  ageDays: number | null;
  activeAgeDays: number | null;
  labels: string;
  parent: string;
  project: string;
  health: HealthStatus;
  reason: string;
  linkedTo?: string;
}

export interface FlowSummary {
  issues: number;
  done: number;
  good: number;
  warning: number;
  critical: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  leadTimeSampleSize: number;
  cycleTimeSampleSize: number;
}

export interface FlowMetrics extends FlowSummary {
  items: FlowItem[];
}

export interface SprintEntry extends FlowSummary {
  name: string;
  issues: number;
  completedIssues: number;
  committedPoints: number;
  completedPoints: number;
  completionRate: number;
  pointCompletionRate: number;
}

export interface SprintMetrics {
  hasSprintData: boolean;
  sprintCount: number;
  sprints: SprintEntry[];
}

export interface CapacityEntry {
  assignee: string;
  issues: number;
  activeIssues: number;
  doneIssues: number;
  storyPoints: number;
  doneStoryPoints: number;
  loadShare: number;
}

export interface StoryPointMetrics {
  totalStoryPoints: number;
  completedStoryPoints: number;
  remainingStoryPoints: number;
  pointCompletionRate: number;
}

export interface PredictionResult {
  complete: boolean;
  daysRemaining: number | null;
  predictedDate?: string;
  velocityPerDay?: number;
}

export interface RiskMetrics {
  blockedIssues: number;
  overdueIssues: number;
  highPriorityOpenIssues: number;
  openDefects: number;
}

export interface DashboardMetrics {
  totalIssues: number;
  doneIssues: number;
  activeIssues: number;
  blockedIssues: number;
  openDefects: number;
  completionRate: number;
  customerVisibleProgress: number;
  overallDeliveryConfidence: number;
  totalCustomerVisible: number;
  flow: FlowMetrics;
  sprint: SprintMetrics;
  kanban: { byStatus: unknown[]; byHighLevelStatus: unknown[] };
  quarters: unknown[];
  capacity: CapacityEntry[];
  epics: unknown[];
  labels: unknown;
  types: unknown[];
  projects: unknown[];
  parents: unknown[];
  relations: unknown;
  risk: RiskMetrics;
  storyPoints: StoryPointMetrics;
  healthScore: number;
  prediction: PredictionResult;
  insights: string[];
}
