// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

// Issue type labels are admin-configurable (custom types allowed — see
// src/types/issueTypeHierarchy.ts and the "Issue Type Hierarchy" admin
// screen), so this can no longer be a closed union. 'Unknown' is the only
// guaranteed value, used when a raw Jira type matches no configured definition.
export type IssueNodeType = string;

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
  isOnRiskPath:     boolean;   // true when this node is on the path from a risky node to the root
  isLargestBranch:  boolean;   // true when this node belongs to the largest unfinished branch
}

export interface RelationEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationEdgeType;
  isOnRiskPath?: boolean;   // true when both endpoints are on the risk path
  label?: string;
}

export interface LargestBranch {
  rootKey:    string;   // issue key of the branch root (direct child of focus)
  rootLabel:  string;   // summary / label of the branch root
  openCount:  number;   // total open (non-done) items in this subtree
  totalCount: number;   // total items in this subtree
  completionPct: number;
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
  largestUnfinishedBranch: LargestBranch | null;
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
