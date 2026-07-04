// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

export type HealthStatus = 'good' | 'warning' | 'critical';
export type HealthBand = 'excellent' | 'good' | 'moderate' | 'at-risk' | 'critical';

export interface FlowItem {
  key: string;
  summary: string;
  type: string;
  status: string;
  sprint: string;
  epic: string;
  isOrphan: boolean;
  assignee: string;
  priority: string;
  labels: string;
  parent: string;
  project: string;
  linkedTo: string;
  storyPoints: number;
  leadTimeDays: number | null;
  cycleTimeDays: number | null;
  ageDays: number | null;
  activeAgeDays: number | null;
  health: HealthStatus;
  reason: string;
}

export interface FlowMetrics {
  issues: number;
  done: number;
  good: number;
  warning: number;
  critical: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  leadTimeSampleSize: number;
  cycleTimeSampleSize: number;
  items: FlowItem[];
}

export interface SprintData {
  name: string;
  issues: number;
  completedIssues: number;
  committedPoints: number;
  completedPoints: number;
  completionRate: number;
  pointCompletionRate: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  critical: number;
  warning: number;
  good: number;
}

export interface SprintMetrics {
  hasSprintData: boolean;
  sprintCount: number;
  sprints: SprintData[];
}

export interface KanbanStatusItem {
  name: string;
  count: number;
  done: number;
  storyPoints: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  critical: number;
  warning: number;
  good: number;
}

export interface KanbanMetrics {
  byStatus: KanbanStatusItem[];
  byHighLevelStatus: KanbanStatusItem[];
}

export interface QuarterData {
  quarter: string;
  issues: number;
  doneIssues: number;
  activeIssues: number;
  storyPoints: number;
  completedStoryPoints: number;
  completionRate: number;
  pointCompletionRate: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  statusBreakdown: { name: string; count: number }[];
  critical: number;
  warning: number;
  good: number;
}

export interface CapacityItem {
  assignee: string;
  issues: number;
  activeIssues: number;
  doneIssues: number;
  storyPoints: number;
  doneStoryPoints: number;
  loadShare: number;
}

export interface EpicItem {
  epic: string;
  issues: number;
  completedIssues: number;
  storyPoints: number;
  doneStoryPoints: number;
  progress: number;
  pointProgress: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  critical: number;
  warning: number;
  good: number;
}

export interface LabelStat {
  label: string;
  count: number;
  done: number;
  completionRate: number;
  storyPoints: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  critical: number;
  warning: number;
  good: number;
}

export interface LabelMetrics {
  labelStats: LabelStat[];
  totalLabeled: number;
  totalUnlabeled: number;
  uniqueLabels: number;
}

export interface TypeMetric {
  type: string;
  count: number;
  done: number;
  completionRate: number;
  storyPoints: number;
  critical: number;
  warning: number;
}

export interface ProjectMetric {
  project: string;
  count: number;
  done: number;
  completionRate: number;
  storyPoints: number;
  critical: number;
  warning: number;
}

export interface ParentMetric {
  parent: string;
  count: number;
  done: number;
  completionRate: number;
  storyPoints: number;
  critical: number;
  warning: number;
}

export interface LinkStat {
  type: string;
  count: number;
  uniqueFrom: number;
}

export interface LinkedItem {
  key: string;
  summary: string;
  status: string;
  linkCount: number;
  linkTypes: string;
}

export interface BlockedItem {
  key: string;
  summary: string;
  status: string;
  blockedBy: string;
  blockCount: number;
}

export interface RelationsMetrics {
  hasLinks: boolean;
  totalLinks: number;
  itemsWithLinks: number;
  linkTypes: number;
  linkStats: LinkStat[];
  mostLinked: LinkedItem[];
  blockedItems: BlockedItem[];
}

export interface RiskMetrics {
  blockedIssues: number;
  overdueIssues: number;
  highPriorityOpenIssues: number;
  openDefects: number;
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
  healthScore: number;
  flow: FlowMetrics;
  sprint: SprintMetrics;
  kanban: KanbanMetrics;
  quarters: QuarterData[];
  capacity: CapacityItem[];
  epics: EpicItem[];
  labels: LabelMetrics;
  types: TypeMetric[];
  projects: ProjectMetric[];
  parents: ParentMetric[];
  relations: RelationsMetrics;
  risk: RiskMetrics;
  storyPoints: StoryPointMetrics;
  prediction: PredictionResult;
  insights: string[];
}
