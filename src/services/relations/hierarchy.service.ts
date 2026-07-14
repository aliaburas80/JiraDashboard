// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Hierarchy reconstruction service.
// Reconstructs parent→child relationships from messy Jira exports using
// multiple signals: explicit Parent Key, Epic Link, key-prefix matching.
// Each inferred link carries a confidence score.

import type { IssueTypeDefinition } from '@/types/issueTypeHierarchy';
import { DEFAULT_ISSUE_TYPES } from '@/types/issueTypeHierarchy';

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

function addChild(map: HierarchyMap, parentKey: string, childKey: string): void {
  if (!map.children.has(parentKey)) map.children.set(parentKey, []);
  if (!map.children.get(parentKey)!.includes(childKey)) {
    map.children.get(parentKey)!.push(childKey);
  }
}

// Builds a raw-type-name → hierarchy-level lookup from the configured issue
// types (admin-configurable — see src/types/issueTypeHierarchy.ts). A type
// name not present in any definition's matchNames is "unrecognized" and is
// never a candidate for prefix-inference or root-orphan-exemption.
function buildLevelLookup(types: IssueTypeDefinition[]): Map<string, number> {
  const lookup = new Map<string, number>();
  for (const t of types) {
    for (const name of t.matchNames) lookup.set(name.trim().toLowerCase(), t.level);
  }
  return lookup;
}

export function reconstructHierarchy(
  issues: JiraIssue[],
  issueTypes: IssueTypeDefinition[] = DEFAULT_ISSUE_TYPES,
): HierarchyMap {
  const map: HierarchyMap = {
    children: new Map(),
    parent:   new Map(),
    epic:     new Map(),
    links:    [],
    orphanKeys: new Set(),
  };

  const keySet = new Set(issues.map(getKey).filter(Boolean));
  const levelByType = buildLevelLookup(issueTypes);
  const minLevel = issueTypes.length > 0 ? Math.min(...issueTypes.map(t => t.level)) : 0;

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
  // If an issue has no explicit parent/epic but shares its key prefix with an
  // issue one hierarchy level up (per the configured type hierarchy — e.g.
  // Sub-task -> Story, Story -> Epic, Epic -> Project, Project -> Product),
  // infer the link. Three independent guards, all required:
  //   - the issue's type must be recognized and not already the topmost level
  //     (a root never needs a parent inferred);
  //   - `map.children.has(key)` skips any issue Step 1 already established as
  //     a parent/container — it can never also be a leaf needing inference;
  //   - the candidate parent must be exactly one level up, not just "any Epic"
  //     — this also fixes a Sub-task previously being linked straight to an
  //     Epic, skipping its actual Story/Task parent level.
  const issuesByKey = new Map(issues.map(i => [getKey(i), i]));
  for (const issue of issues) {
    const key = getKey(issue);
    if (!key || map.parent.has(key) || map.epic.has(key)) continue;
    if (map.children.has(key)) continue; // already a parent/container — not a leaf

    const level = levelByType.get(getType(issue));
    if (level === undefined || level <= minLevel) continue; // unrecognized or already a root

    const prefix = keyPrefix(key);
    const parentLevel = level - 1;

    const matchingParent = [...keySet].find(candidateKey => {
      if (candidateKey === key || keyPrefix(candidateKey) !== prefix) return false;
      const candidate = issuesByKey.get(candidateKey);
      return candidate !== undefined && levelByType.get(getType(candidate)) === parentLevel;
    });

    if (matchingParent) {
      map.epic.set(key, matchingParent);
      addChild(map, matchingParent, key);
      map.links.push({ parentKey: matchingParent, childKey: key, type: 'inferred-prefix', confidence: 0.8 });
    }
  }

  // ── Step 3: Identify orphans ──────────────────────────────────────────────
  // Only the topmost configured level is exempt by definition (a root
  // legitimately has no parent). A node that already has children is also
  // exempt regardless of its type — it's a known container. Unrecognized
  // types remain orphan-eligible, matching the original behavior.
  //
  // CP3-014: this deliberately stays an OR of two signals rather than
  // adopting isOrphanByRules() outright (unlike dataQuality.service.ts,
  // which now does). The canonical rules-based definition asks "does this
  // issue's data have a parent-link field value?" — a data-completeness
  // question. This tree needs a structural-connectivity question instead:
  // "does this issue's parent/epic link actually resolve to a node present
  // in this hierarchy?" A dangling Epic Link (e.g. pointing to an epic from
  // a project excluded from the current upload) has a field value, so
  // isOrphanByRules would say "not an orphan" — but the tree still can't
  // connect it to anything, so it must render as unlinked. The precomputed
  // FlowItem.isOrphan flag (rules-based) is honored first; the structural
  // check is the fallback for both that dangling-link case and for callers
  // that pass raw issues with no precomputed flag at all.
  for (const issue of issues) {
    const key = getKey(issue);
    if (!key) continue;
    if (map.children.has(key)) continue; // a container/root, not an orphan

    const level = levelByType.get(getType(issue));
    if (level !== undefined && level <= minLevel) continue; // configured root — not an orphan

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
