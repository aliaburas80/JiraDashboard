// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Global page/feature search (Phase 1). Pure, framework-free ranking over the
// existing DC_NAV_GROUPS registry — no new data source, no new dependency.
// Callers are expected to pass already role-filtered groups (getNavGroupsForRole)
// so a result never links to a page the current user can't open.
// Phase 2 (Jira issue-data search) is a separate, later capability — this
// module intentionally only knows about pages/features, not uploaded data.

import type { DCShellNavGroup, DCShellNavItem, DCShellNavStatus } from '@/components/dc-shell/navigation';
import type { IconName } from '@/lib/icons';

export interface PageSearchResult {
  id:         string;
  title:      string;
  desc:       string;
  href:       string;
  status:     DCShellNavStatus;
  icon?:      IconName;
  groupId:    string;
  groupLabel: string;
}

function flattenGroups(groups: DCShellNavGroup[]): PageSearchResult[] {
  return groups.flatMap(group =>
    group.items.map((item: DCShellNavItem) => ({
      id:         item.id,
      title:      item.title,
      desc:       item.desc,
      href:       item.href,
      status:     item.status,
      icon:       item.icon,
      groupId:    group.id,
      groupLabel: group.label,
    })),
  );
}

// Higher is a better match. 0 means "no match, exclude". Plain substring
// checks only (no regex) — a search query is untrusted user input and must
// never be interpreted as a pattern.
function scoreMatch(query: string, result: PageSearchResult): number {
  const title = result.title.toLowerCase();
  const desc  = result.desc.toLowerCase();
  const group = result.groupLabel.toLowerCase();

  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (desc.includes(query)) return 40;
  if (group.includes(query)) return 20;
  return 0;
}

/**
 * Ranked page/feature search over already role-filtered nav groups.
 * An empty (or whitespace-only) query returns every item in its natural
 * group order — this is the "browse everything" default view, not a
 * degenerate case to special-case away.
 */
export function searchPages(query: string, groups: DCShellNavGroup[]): PageSearchResult[] {
  const flattened = flattenGroups(groups);
  const q = query.trim().toLowerCase();
  if (!q) return flattened;

  return flattened
    .map(result => ({ result, score: scoreMatch(q, result) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
    .map(({ result }) => result);
}
