// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import type { NodeTypeConfig, RelationEdgeType, EdgeConfig } from '@/types/relations';
import type { IssueTypeDefinition } from '@/types/issueTypeHierarchy';
import { DEFAULT_ISSUE_TYPES, UNKNOWN_ISSUE_TYPE } from '@/types/issueTypeHierarchy';

const UNKNOWN_NODE_CONFIG: NodeTypeConfig = { ...UNKNOWN_ISSUE_TYPE };

// Builds the node-type → visual-style lookup from the admin-configured issue
// types (including any custom types). 'Unknown' is always present as a safe
// fallback for a raw Jira type that matches no configured definition.
export function buildNodeTypeConfig(issueTypes: IssueTypeDefinition[]): Record<string, NodeTypeConfig> {
  const config: Record<string, NodeTypeConfig> = { Unknown: UNKNOWN_NODE_CONFIG };
  for (const t of issueTypes) {
    config[t.label] = { color: t.color, bg: t.bg, border: t.border, icon: t.icon, size: t.size };
  }
  return config;
}

// Default-config fallback for callers that haven't loaded the live config yet.
export const NODE_TYPE_CONFIG: Record<string, NodeTypeConfig> = buildNodeTypeConfig(DEFAULT_ISSUE_TYPES);

// Edge colors reference design tokens (not raw hex) — a fixed, finite set of
// relationship kinds (unlike per-issue-type node colors, which are legitimately
// admin-configurable and therefore arbitrary; see IssueTypeDefinition).
export const EDGE_TYPE_CONFIG: Record<RelationEdgeType, EdgeConfig> = {
  'parent-child':   { strokeColor: 'var(--color-text-secondary)', strokeWidth: 2,   animated: false },
  'epic-link':      { strokeColor: 'var(--dc-purple)', strokeWidth: 2,   animated: false },
  'blocks':         { strokeColor: 'var(--color-danger)', strokeWidth: 2,   animated: true,  label: 'blocks' },
  'is-blocked-by':  { strokeColor: 'var(--color-danger)', strokeWidth: 2,   strokeDasharray: '5,3', animated: false, label: 'blocked by' },
  'depends-on':     { strokeColor: 'var(--color-text-secondary)', strokeWidth: 1.5, strokeDasharray: '4,4', animated: false, label: 'depends on' },
  'relates-to':     { strokeColor: 'var(--color-border-strong)', strokeWidth: 1,   animated: false },
  'orphan-link':    { strokeColor: 'var(--dc-orange)', strokeWidth: 1.5, strokeDasharray: '6,3', animated: false },
};

export const ORPHAN_STYLE = {
  border: '2px dashed var(--dc-orange)',
  bg: 'color-mix(in srgb, var(--dc-orange) 8%, var(--dc-s1))',
  badgeText: 'Orphan Issue',
  badgeColor: 'var(--dc-orange)',
};
