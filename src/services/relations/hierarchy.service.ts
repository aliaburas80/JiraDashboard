// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Hierarchy reconstruction service.
// Reconstructs parent→child relationships from messy Jira exports using
// multiple signals: explicit Parent Key, Epic Link, key-prefix matching.
// Each inferred link carries a confidence score.

type JiraIssue = Record<string, unknown>;

export interface HierarchyLink {
  parentKey: string;
  childKey: string;
  type: 'parent-key' | 'epic-link' | 'inferred-prefix' | 'inferred-sprint';
  confidence: number; // 1.0 = explicit, 0.8 = prefix, 0.5 = sprint
}

export interface HierarchyMap {
  // parentKey → child keys
  children: Map<string, string[]>;
  // childKey → parentKey
  parent: Map<string, string>;
  // childKey → epicKey
  epic: Map<string, string>;
  // all links with confidence scores
  links: HierarchyLink[];
  // keys with no resolvable parent
  orphanKeys: Set<string>;
}

function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }

// Accessors handle BOTH FlowItem (camelCase/short) and raw JiraIssue (Title Case) formats.
// FlowItem fields: key, type, epic (= Epic Link || Parent Key), parent (= Parent Key), sprint
// Raw Jira fields: Issue Key, Issue Type, Epic Link, Parent Key, Sprint

function getKey(issue: JiraIssue): string {
  return String(issue['Issue Key'] ?? issue['key'] ?? issue['issueKey'] ?? '').trim();
}

function getType(issue: JiraIssue): string {
  return norm(issue['Issue Type'] ?? issue['type'] ?? '');
}

function getEpicLink(issue: JiraIssue): string {
  // FlowItem.epic = Epic Link || Parent Key (blended). Prefer explicit Epic Link raw field.
  return String(issue['Epic Link'] ?? issue['epicLink'] ?? issue['epic'] ?? '').trim();
}

function getParentKey(issue: JiraIssue): string {
  return String(issue['Parent Key'] ?? issue['parentKey'] ?? issue['parent'] ?? '').trim();
}

function getSprint(issue: JiraIssue): string {
  return String(issue['Sprint'] ?? issue['Actual Sprint'] ?? issue['sprint'] ?? '').trim();
}

// Extracts project prefix from key e.g. "PROJ-123" → "PROJ"
function keyPrefix(key: string): string {
  return key.split('-')[0] ?? '';
}

// Issue types expected to roll up under an Epic. Prefix-inference and orphan
// detection only apply to these — every issue in a project shares the same key
// prefix, so applying either rule to higher-level types (Epic's own parent:
// Initiative/Project/Product under Advanced Roadmaps hierarchy) would create a
// phantom link to an unrelated Epic, or wrongly flag a legitimate root as an
// orphan just because it has no parent (which is correct for a root).
const LEAF_TYPES = new Set([
  'story', 'user story', 'task', 'improvement', 'feature',
  'sub-task', 'subtask', 'bug', 'defect', 'error',
  'spike', 'technical debt', 'risk', 'change request','product','project'
]);

function addChild(map: HierarchyMap, parentKey: string, childKey: string): void {
  if (!map.children.has(parentKey)) map.children.set(parentKey, []);
  if (!map.children.get(parentKey)!.includes(childKey)) {
    map.children.get(parentKey)!.push(childKey);
  }
}

export function reconstructHierarchy(issues: JiraIssue[]): HierarchyMap {
  const map: HierarchyMap = {
    children: new Map(),
    parent:   new Map(),
    epic:     new Map(),
    links:    [],
    orphanKeys: new Set(),
  };

  const keySet = new Set(issues.map(getKey).filter(Boolean));
  const epicKeys = new Set(issues.filter(i => getType(i) === 'epic').map(getKey));

  // ── Step 1: Explicit links ────────────────────────────────────────────────
  for (const issue of issues) {
    const key    = getKey(issue);
    if (!key) continue;

    const parent = getParentKey(issue);
    const epic   = getEpicLink(issue);

    if (parent && keySet.has(parent) && parent !== key) {
      map.parent.set(key, parent);
      addChild(map, parent, key);
      map.links.push({ parentKey: parent, childKey: key, type: 'parent-key', confidence: 1.0 });
    }

    if (epic && keySet.has(epic) && epic !== key && !map.parent.has(key)) {
      map.epic.set(key, epic);
      addChild(map, epic, key);
      map.links.push({ parentKey: epic, childKey: key, type: 'epic-link', confidence: 1.0 });
    }
  }

  // ── Step 2: Prefix-based inference ───────────────────────────────────────
  // If a Story has no epic but shares key prefix with a known Epic, infer the link.
  // Two independent guards, both required: LEAF_TYPES restricts this to types
  // expected to roll up under an Epic, AND `map.children.has(key)` skips any
  // issue that Step 1 already established as a parent/container — a node that
  // is already someone else's explicit parent can never also be a leaf needing
  // a phantom epic link, regardless of its type name. The second guard matters
  // because hierarchy level names (Initiative/Project/Product/Theme) are
  // admin-configurable per Jira instance and not reliably enumerable by name.
  for (const issue of issues) {
    const key = getKey(issue);
    if (!key || map.parent.has(key) || map.epic.has(key)) continue;
    if (epicKeys.has(key)) continue; // skip epics themselves
    if (map.children.has(key)) continue; // already a parent/container — not a leaf
    if (!LEAF_TYPES.has(getType(issue))) continue; // skip non-leaf/unrecognized types

    const prefix = keyPrefix(key);

    // Find epics with the same prefix
    const matchingEpic = [...epicKeys].find(e => keyPrefix(e) === prefix);
    if (matchingEpic) {
      map.epic.set(key, matchingEpic);
      addChild(map, matchingEpic, key);
      map.links.push({ parentKey: matchingEpic, childKey: key, type: 'inferred-prefix', confidence: 0.8 });
    }
  }

  // ── Step 3: Identify orphans ──────────────────────────────────────────────
  // A node that already has children is a known container/root (e.g. an Epic's
  // own parent under Advanced Roadmaps hierarchy) — it legitimately has no
  // parent of its own, so it is never an orphan regardless of its type name.
  for (const issue of issues) {
    const key = getKey(issue);
    if (!key) continue;
    if (epicKeys.has(key)) continue; // epics are roots, not orphans
    if (map.children.has(key)) continue; // a container/root, not an orphan
    if (!LEAF_TYPES.has(getType(issue))) continue; // higher-level roots are not orphans either
    // Respect pre-computed isOrphan from FlowItem (if available)
    const preComputed = issue['isOrphan'];
    const isOrphanComputed = preComputed === true || preComputed === 'true';
    if (isOrphanComputed || (!map.parent.has(key) && !map.epic.has(key))) {
      map.orphanKeys.add(key);
    }
  }

  return map;
}

// Returns all descendant keys (BFS)
export function getDescendants(key: string, map: HierarchyMap): string[] {
  const result: string[] = [];
  const queue  = [key];
  const visited = new Set<string>();
  while (queue.length) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const children = map.children.get(cur) ?? [];
    result.push(...children);
    queue.push(...children);
  }
  return result;
}

// Returns full ancestor chain: child → parent → grandparent → ...
export function getAncestorChain(key: string, map: HierarchyMap): string[] {
  const chain: string[] = [];
  let current = key;
  const visited = new Set<string>();
  while (true) {
    const parent = map.parent.get(current) ?? map.epic.get(current);
    if (!parent || visited.has(parent)) break;
    chain.push(parent);
    visited.add(parent);
    current = parent;
  }
  return chain;
}
