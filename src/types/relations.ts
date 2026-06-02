// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type IssueNodeType =
  | 'Epic' | 'Story' | 'Task' | 'Sub-task' | 'Bug'
  | 'Spike' | 'Technical Debt' | 'Risk' | 'Change Request' | 'Unknown';

export type RelationEdgeType =
  | 'parent-child'
  | 'epic-link'
  | 'blocks'
  | 'is-blocked-by'
  | 'depends-on'
  | 'relates-to'
  | 'orphan-link';

export type NodeHealthStatus = 'good' | 'warning' | 'critical' | 'done' | 'orphan';

export interface RelationNode {
  id: string;
  issueKey: string;
  summary: string;
  type: IssueNodeType;
  status: string;
  assignee: string;
  priority: string;
  storyPoints: number | null;
  health: NodeHealthStatus;
  isBlocked: boolean;
  isOrphan: boolean;
  isMissingParent: boolean;
  isMissingEpic: boolean;
  isDone: boolean;
  sprint: string;
  epicLink: string;
  parentKey: string;
  reason: string;
  depth: number;
  childCount: number;
  isExpanded: boolean;
  isFocusNode: boolean;
  isOnRiskPath: boolean;   // true when this node is on the path from a risky node to the root
}

export interface RelationEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationEdgeType;
  isOnRiskPath?: boolean;   // true when both endpoints are on the risk path
  label?: string;
}

export interface RelationStats {
  totalRelated: number;
  completedCount: number;
  openCount: number;
  blockedCount: number;
  bugCount: number;
  criticalCount: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  completionPct: number;
  blockedRatio: number;
  dependencyCount: number;
  orphanCount: number;
  deliveryConfidence: number;
}

export interface RelationGraph {
  focusKey: string;
  focusType: IssueNodeType;
  nodes: RelationNode[];
  edges: RelationEdge[];
  orphanNodes: RelationNode[];
  stats: RelationStats;
  insights: string[];
}

export interface NodeTypeConfig {
  color: string;
  bg: string;
  border: string;
  icon: string;
  size: 'sm' | 'md' | 'lg';
}

export interface EdgeConfig {
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray?: string;
  animated: boolean;
  label?: string;
}
