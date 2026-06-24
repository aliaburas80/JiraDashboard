// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Role-Based Delivery Coaching Insights — types.
// Pure interpretation layer over DashboardMetrics: no new calculations,
// only role/category-specific advice generated from already-computed metrics.

import type { CheckSeverity } from './dataQuality';
import type { ConfidenceBand } from './metricConfidence';

// 7 content categories. Note this is NOT the same set as AppRole (6 roles) —
// the 'manager' role sees 3 of these categories as tabs (engineering_manager,
// delivery_manager, team_lead); see coachingOrchestrator.service.ts.
export type CoachingCategory =
  | 'scrum_master'
  | 'product_owner'
  | 'engineering_manager'
  | 'delivery_manager'
  | 'team_lead'
  | 'c_level'
  | 'admin';

export interface CoachingEvidence {
  metricKey: string;   // e.g. 'flow.averageCycleTimeDays'
  label: string;       // e.g. 'Average Cycle Time'
  value: string;       // formatted, e.g. '18.4 days'
  detail: string;      // plain-English sentence citing the real number
}

export interface CeremonyAdvice {
  dailyStandup: string[];
  refinement: string[];
  sprintPlanning: string[];
  sprintReview: string[];
  retrospective: string[];
}

export interface CoachingConfidence {
  score: number;          // 0-100, post data-quality downgrade
  band: ConfidenceBand;
  reason: string;         // cites the worst contributing metric + data-quality band
}

export interface RoleBasedCoachingInsight {
  category: CoachingCategory;
  healthSummary: string;
  weakPoints: string[];
  focusAreas: string[];
  recommendedActions: string[];
  preventionAdvice: string[];
  ceremonyAdvice: CeremonyAdvice;
  nextSprintSuggestions: string[];
  evidence: CoachingEvidence[];
  severity: CheckSeverity;
  confidence: CoachingConfidence;
}

export interface CoachingInsightsBundle {
  generatedAt: string;
  categories: RoleBasedCoachingInsight[]; // only categories visible to the requesting role, in display order
}

export const CATEGORY_LABELS: Record<CoachingCategory, string> = {
  scrum_master: 'Scrum Master',
  product_owner: 'Product Owner',
  engineering_manager: 'Engineering Manager',
  delivery_manager: 'Delivery Manager',
  team_lead: 'Team Lead',
  c_level: 'C-level',
  admin: 'Admin',
};
