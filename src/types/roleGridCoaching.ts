// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Team Role View — a simple, light, role-based grid replacing the tab-based
// Role-Based Coaching Insights page. Three fixed columns (Scrum Master,
// Product Owner, Manager), each showing rules to monitor, current actions,
// and key measures. No per-viewer personalization, no evidence chips, no
// confidence scoring, no ceremony advice — see roleGridView.mapper.ts for
// where each value comes from.

export type Status = 'critical' | 'risk' | 'review' | 'healthy';

export interface RoleRule {
  title:       string;
  description: string;
  status:      Status;
}

export interface RoleAction {
  title:  string;
  detail: string;
}

export interface RoleMetric {
  label: string;
  value: string | number;
  // CP3-012: true when `value` is a fixed placeholder constant (no real data
  // exists behind it yet — see RETRO_ACTIONS_COMPLETED_FALLBACK_PCT in
  // roleGridView.mapper.ts) rather than a genuine calculation from the
  // uploaded data. Rendered with a visible qualifier by MetricItem so it
  // can't be mistaken for a real number. Omitted/false for real metrics.
  isEstimate?: boolean;
}

export type RoleTone = 'blue' | 'purple' | 'green';

export interface RoleView {
  id:       string;
  initials: string;
  title:    string;
  subtitle: string;
  tone:     RoleTone;
  rules:    RoleRule[];
  actions:  RoleAction[];
  metrics:  RoleMetric[];
}
