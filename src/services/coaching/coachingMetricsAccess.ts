// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Small, typed accessors for the DashboardMetrics fields that src/types/metrics.ts
// declares as `unknown` (relations, epics) even though the runtime shape built by
// metrics.service.ts is concrete. Scoped to this feature only — does not touch the
// existing exported DashboardMetrics type (no unrelated refactor).

import type { DashboardMetrics } from '@/types/metrics';

export interface CoachingBlockedItem {
  key: string;
  summary: string;
  status: string;
  blockedBy: string;
  blockCount: number;
}

export interface CoachingRelations {
  hasLinks: boolean;
  totalLinks: number;
  blockedItems: CoachingBlockedItem[];
}

export interface CoachingEpicEntry {
  epic: string;
  issues: number;
  completedIssues: number;
  progress: number;
  critical: number;
}

export function getRelations(metrics: DashboardMetrics): CoachingRelations {
  const raw = metrics.relations as Partial<CoachingRelations> | null | undefined;
  return {
    hasLinks: raw?.hasLinks ?? false,
    totalLinks: raw?.totalLinks ?? 0,
    blockedItems: Array.isArray(raw?.blockedItems) ? raw!.blockedItems! : [],
  };
}

export function getEpics(metrics: DashboardMetrics): CoachingEpicEntry[] {
  const raw = metrics.epics as Partial<CoachingEpicEntry>[] | null | undefined;
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => ({
    epic: e.epic ?? 'Unknown',
    issues: e.issues ?? 0,
    completedIssues: e.completedIssues ?? 0,
    progress: e.progress ?? 0,
    critical: e.critical ?? 0,
  }));
}
