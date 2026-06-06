// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Work Item Explorer — relation graph builder.
// Takes a focus issue key and the full issue dataset, returns a RelationGraph
// ready to render as an interactive visual map.

import type { RelationGraph, RelationNode, RelationEdge, IssueNodeType, NodeHealthStatus, RelationStats } from '@/types/relations';
import { reconstructHierarchy, getDescendants, getAncestorChain } from './hierarchy.service';
import { detectOrphans } from './orphanRelation.service';

type JiraIssue = Record<string, unknown>;

// ── Issue type normalisation ──────────────────────────────────────────────────

const TYPE_MAP: Record<string, IssueNodeType> = {
  epic: 'Epic', story: 'Story', 'user story': 'Story',
  task: 'Task', improvement: 'Task', feature: 'Story',
  'sub-task': 'Sub-task', subtask: 'Sub-task',
  bug: 'Bug', defect: 'Bug', error: 'Bug',
  spike: 'Spike', 'technical debt': 'Technical Debt',
  risk: 'Risk', 'change request': 'Change Request',
};

function resolveType(raw: unknown): IssueNodeType {
  return TYPE_MAP[String(raw ?? '').trim().toLowerCase()] ?? 'Unknown';
}

function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }

const DONE_ST = new Set(['done', 'closed', 'resolved']);

// Field accessors — support both FlowItem (key/type/epic/parent) and raw JiraIssue (Issue Key/etc.)
function f(issue: JiraIssue, rawField: string, flowField: string, fallback = ''): string {
  return String(issue[rawField] ?? issue[flowField] ?? fallback).trim();
}

function getIssueKey(issue: JiraIssue): string {
  return f(issue, 'Issue Key', 'key') || f(issue, 'issueKey', 'id');
}

function isDone(issue: JiraIssue): boolean {
  return DONE_ST.has(norm(f(issue, 'Status', 'status')));
}

function isBlocked(issue: JiraIssue): boolean {
  // FlowItem: health === 'critical' and reason contains 'Blocked' — also check raw flag
  const flag = issue['Blocked Flag'] ?? issue['isBlocked'];
  if (flag === true || norm(flag) === 'true' || norm(flag) === 'yes') return true;
  // FlowItem carries health='critical' when blocked
  const h = norm(issue['health'] ?? '');
  const r = norm(issue['reason'] ?? '');
  return h === 'critical' && r.includes('block');
}

function healthStatus(issue: JiraIssue, isOrphan: boolean): NodeHealthStatus {
  if (isOrphan)         return 'orphan';
  if (isDone(issue))    return 'done';
  // FlowItem already has health computed
  const h = norm(issue['health'] ?? issue['Health'] ?? '');
  if (h === 'critical') return 'critical';
  if (h === 'warning')  return 'warning';
  if (isBlocked(issue)) return 'critical';
  return 'good';
}

// ── Build a RelationNode from a JiraIssue or FlowItem ─────────────────────────

function buildNode(
  issue: JiraIssue,
  depth: number,
  isFocus: boolean,
  isOrphan: boolean,
  childCount: number,
): RelationNode {
  const key     = getIssueKey(issue);
  const typeRaw = f(issue, 'Issue Type', 'type');
  return {
    id:             key,
    issueKey:       key,
    summary:        f(issue, 'Summary',     'summary'),
    type:           resolveType(typeRaw),
    status:         f(issue, 'Status',      'status',   'Unknown'),
    assignee:       f(issue, 'Assignee',    'assignee', 'Unassigned'),
    priority:       f(issue, 'Priority',    'priority'),
    storyPoints:    Number(issue['Story Points'] ?? issue['storyPoints']) || null,
    health:         healthStatus(issue, isOrphan),
    isBlocked:      isBlocked(issue),
    isOrphan,
    isMissingParent: isOrphan && ['sub-task','subtask','bug','defect'].includes(norm(typeRaw)),
    isMissingEpic:   isOrphan && ['story','user story','task','feature'].includes(norm(typeRaw)),
    isDone:         isDone(issue),
    sprint:         f(issue, 'Sprint', 'sprint') || f(issue, 'Actual Sprint', 'sprint'),
    epicLink:       f(issue, 'Epic Link',  'epic'),
    parentKey:      f(issue, 'Parent Key', 'parent'),
    reason:         f(issue, 'reason',     'reason'),
    depth,
    childCount,
    isExpanded:     depth < 2,  // default: expand first 2 levels
    isFocusNode:      isFocus,
    isOnRiskPath:     false, // set after risk path computation
    isLargestBranch:  false, // set after largest branch computation
  };
}

// ── Largest unfinished branch computation ─────────────────────────────────────
// Finds which direct child of the focus node has the most open (non-done) items
// in its sub-tree. Helps users know where to concentrate their effort.

function computeLargestUnfinishedBranch(
  nodes: RelationNode[],
  edges: RelationEdge[],
  focusKey: string,
): { largestBranch: import('@/types/relations').LargestBranch | null; branchNodeIds: Set<string> } {
  // Build parent→children map
  const children = new Map<string, string[]>();
  edges.forEach(e => {
    if (e.type === 'parent-child' || e.type === 'epic-link') {
      if (!children.has(e.sourceId)) children.set(e.sourceId, []);
      children.get(e.sourceId)!.push(e.targetId);
    }
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // BFS to collect all descendants of a given root
  function getSubtree(rootId: string): string[] {
    const result: string[] = [];
    const queue = [rootId];
    const visited = new Set<string>();
    while (queue.length) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      result.push(cur);
      (children.get(cur) ?? []).forEach(c => queue.push(c));
    }
    return result;
  }

  // Get direct children of focus
  const directChildren = (children.get(focusKey) ?? []).filter(id => id !== focusKey);
  if (!directChildren.length) return { largestBranch: null, branchNodeIds: new Set() };

  let best: import('@/types/relations').LargestBranch | null = null;
  let bestSubtreeIds: string[] = [];

  directChildren.forEach(childId => {
    const subtreeIds = getSubtree(childId);
    const subtreeNodes = subtreeIds.map(id => nodeMap.get(id)).filter(Boolean) as RelationNode[];
    const total = subtreeNodes.length;
    const open  = subtreeNodes.filter(n => !n.isDone).length;
    if (open === 0) return;
    if (!best || open > best.openCount) {
      const childNode = nodeMap.get(childId);
      best = {
        rootKey:  childId,
        rootLabel: childNode ? `${childNode.issueKey} — ${childNode.summary.slice(0, 40)}` : childId,
        openCount: open,
        totalCount: total,
        completionPct: total > 0 ? Math.round(((total - open) / total) * 100) : 0,
      };
      bestSubtreeIds = subtreeIds;
    }
  });

  return { largestBranch: best, branchNodeIds: new Set(bestSubtreeIds) };
}

// ── Risk path computation ─────────────────────────────────────────────────────
// For every blocked or critical node, walk up the edge tree to the root,
// marking every node (and connecting edge) on that path.

function computeRiskPaths(nodes: RelationNode[], edges: RelationEdge[]): {
  riskNodeIds: Set<string>;
  riskEdgeIds: Set<string>;
} {
  // Build child → parent lookup from hierarchy edges
  const parentOf = new Map<string, string>();
  edges.forEach(e => {
    if (e.type === 'parent-child' || e.type === 'epic-link') {
      parentOf.set(e.targetId, e.sourceId);
    }
  });

  // Edge lookup: (source, target) → edge id
  const edgeKey = (s: string, t: string) => `${s}→${t}`;
  const edgeById = new Map<string, string>();
  edges.forEach(e => {
    edgeById.set(edgeKey(e.sourceId, e.targetId), e.id);
    edgeById.set(edgeKey(e.targetId, e.sourceId), e.id); // bidirectional lookup
  });

  const riskNodeIds = new Set<string>();
  const riskEdgeIds = new Set<string>();

  // Source nodes: blocked OR critical (but not done — done critical is historical)
  const riskyNodes = nodes.filter(n => (n.isBlocked || n.health === 'critical') && !n.isDone);

  riskyNodes.forEach(node => {
    let current = node.id;
    riskNodeIds.add(current);
    // Walk up to root
    while (parentOf.has(current)) {
      const parent = parentOf.get(current)!;
      riskNodeIds.add(parent);
      // Mark the edge connecting them
      const eid = edgeById.get(edgeKey(parent, current)) ?? edgeById.get(edgeKey(current, parent));
      if (eid) riskEdgeIds.add(eid);
      current = parent;
    }
  });

  return { riskNodeIds, riskEdgeIds };
}

// ── Edge helpers ──────────────────────────────────────────────────────────────

let edgeCounter = 0;

function makeEdge(source: string, target: string, type: RelationEdge['type'], label?: string): RelationEdge {
  return { id: `e-${++edgeCounter}-${source}-${target}`, sourceId: source, targetId: target, type, label };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function computeStats(nodes: RelationNode[], edges: RelationEdge[]): RelationStats {
  const total    = nodes.length;
  const done     = nodes.filter(n => n.isDone).length;
  const blocked  = nodes.filter(n => n.isBlocked).length;
  const bugs     = nodes.filter(n => n.type === 'Bug').length;
  const critical = nodes.filter(n => n.health === 'critical').length;
  const orphans  = nodes.filter(n => n.isOrphan).length;
  const deps     = edges.filter(e => e.type === 'blocks' || e.type === 'depends-on').length;
  const sp       = nodes.reduce((s, n) => s + (n.storyPoints ?? 0), 0);
  const spDone   = nodes.filter(n => n.isDone).reduce((s, n) => s + (n.storyPoints ?? 0), 0);
  const compPct  = total > 0 ? Math.round((done / total) * 100) : 0;
  const blockedR = total > 0 ? Math.round((blocked / total) * 100) : 0;

  const confidence = Math.max(0, Math.min(100,
    compPct * 0.5 +
    (total > 0 ? (1 - blocked / total) : 1) * 30 +
    (orphans === 0 ? 20 : Math.max(0, 20 - orphans * 2)),
  ));

  return {
    totalRelated: total, completedCount: done, openCount: total - done,
    blockedCount: blocked, bugCount: bugs, criticalCount: critical,
    totalStoryPoints: sp, completedStoryPoints: spDone,
    completionPct: compPct, blockedRatio: blockedR,
    dependencyCount: deps, orphanCount: orphans,
    deliveryConfidence: Math.round(confidence),
    largestUnfinishedBranch: null, // set after computeLargestUnfinishedBranch
  };
}

// ── Insight generator ─────────────────────────────────────────────────────────

function generateInsights(nodes: RelationNode[], stats: RelationStats, focusKey: string): string[] {
  const ins: string[] = [];

  const childCount = nodes.filter(n => !n.isFocusNode && n.depth > 0).length;
  ins.push(
    `${focusKey} has ${childCount} direct child item${childCount !== 1 ? 's' : ''}. ` +
    `${stats.completedCount} are done and ${stats.openCount} remain open.`
  );

  if (stats.blockedCount > 0) {
    ins.push(`${stats.blockedCount} item${stats.blockedCount > 1 ? 's are' : ' is'} blocked — this is slowing delivery of remaining work.`);
  }

  if (stats.orphanCount > 0) {
    ins.push(`${stats.orphanCount} orphan item${stats.orphanCount > 1 ? 's' : ''} detected. These are not connected to an Epic or Parent and will not appear in roadmap reporting.`);
  }

  if (stats.bugCount > 0) {
    const openBugs = nodes.filter(n => n.type === 'Bug' && !n.isDone).length;
    if (openBugs > 0) {
      ins.push(`${openBugs} bug${openBugs > 1 ? 's' : ''} remain${openBugs === 1 ? 's' : ''} open. Verify these do not block the release.`);
    }
  }

  if (stats.completionPct >= 90) {
    ins.push(`Delivery is near complete at ${stats.completionPct}%. Focus on clearing the remaining open items.`);
  } else if (stats.completionPct < 30 && stats.totalRelated > 5) {
    ins.push(`Only ${stats.completionPct}% complete. Early in delivery — monitor velocity to ensure on-track progress.`);
  }

  if (stats.totalStoryPoints > 0) {
    ins.push(`${stats.completedStoryPoints} of ${stats.totalStoryPoints} story points completed (${Math.round(stats.completedStoryPoints / stats.totalStoryPoints * 100)}%).`);
  }

  return ins;
}

// ── Main graph builder ────────────────────────────────────────────────────────

export function buildRelationGraph(focusKey: string, allIssues: JiraIssue[]): RelationGraph | null {
  edgeCounter = 0;

  const focusIssue = allIssues.find(i => getIssueKey(i) === focusKey);
  if (!focusIssue) return null;

  const hierarchy = reconstructHierarchy(allIssues);
  const issueMap  = new Map(allIssues.map(i => [getIssueKey(i), i]));

  const focusType = resolveType(f(focusIssue, 'Issue Type', 'type'));

  // Graph scope: focus node + its immediate parent (one level up) + its direct children only.
  // No siblings, no full ancestor chain, no unrelated orphans.
  const directParentKey  = hierarchy.parent.get(focusKey) ?? hierarchy.epic.get(focusKey) ?? null;
  const directChildKeys  = hierarchy.children.get(focusKey) ?? [];

  const allRelevantKeys = new Set([
    focusKey,
    ...(directParentKey ? [directParentKey] : []),
    ...directChildKeys,
  ]);

  const nodes: RelationNode[] = [];
  const edges: RelationEdge[] = [];

  // Depth: parent = -1, focus = 0, children = 1
  const depthMap = new Map<string, number>();
  depthMap.set(focusKey, 0);
  if (directParentKey) depthMap.set(directParentKey, -1);
  for (const k of directChildKeys) depthMap.set(k, 1);

  // Build nodes
  for (const key of allRelevantKeys) {
    const issue = issueMap.get(key);
    if (!issue) continue;
    const isOrphan   = hierarchy.orphanKeys.has(key) && key !== focusKey;
    const childCount = (hierarchy.children.get(key) ?? []).length;
    const depth      = depthMap.get(key) ?? 0;
    nodes.push(buildNode(issue, depth, key === focusKey, isOrphan, childCount));
  }

  // Build edges from hierarchy links
  for (const link of hierarchy.links) {
    if (!allRelevantKeys.has(link.parentKey) || !allRelevantKeys.has(link.childKey)) continue;
    const type: RelationEdge['type'] = link.type === 'epic-link' ? 'epic-link' : 'parent-child';
    edges.push(makeEdge(link.parentKey, link.childKey, type));
  }

  // Orphan nodes: only include direct children that are flagged as orphans
  const orphanNodes: RelationNode[] = [];

  // Compute stats and insights
  const stats    = computeStats(nodes, edges);
  const insights = generateInsights(nodes, stats, focusKey);

  // Compute and apply risk paths
  const { riskNodeIds, riskEdgeIds } = computeRiskPaths(nodes, edges);

  // Compute largest unfinished branch
  const { largestBranch, branchNodeIds } = computeLargestUnfinishedBranch(nodes, edges, focusKey);

  const statsWithBranch = { ...stats, largestUnfinishedBranch: largestBranch };

  const nodesWithFlags = nodes.map(n => ({
    ...n,
    isOnRiskPath:    riskNodeIds.has(n.id),
    isLargestBranch: branchNodeIds.has(n.id) && !n.isDone,
  }));
  const edgesWithRisk = edges.map(e => ({ ...e, isOnRiskPath: riskEdgeIds.has(e.id) }));

  // Add insight about largest unfinished branch
  const branchInsights = insights.slice();
  if (largestBranch && largestBranch.openCount >= 1) {
    branchInsights.push(
      `The largest unfinished branch is ${largestBranch.rootLabel} with ${largestBranch.openCount} open item${largestBranch.openCount !== 1 ? 's' : ''} (${largestBranch.completionPct}% complete). Focus here to maximise delivery progress.`
    );
  }

  return { focusKey, focusType, nodes: nodesWithFlags, edges: edgesWithRisk, orphanNodes, stats: statsWithBranch, insights: branchInsights };
}
