// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
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

export const EDGE_TYPE_CONFIG: Record<RelationEdgeType, EdgeConfig> = {
  'parent-child':   { strokeColor: '#64748b', strokeWidth: 2,   animated: false },
  'epic-link':      { strokeColor: '#7c3aed', strokeWidth: 2,   animated: false },
  'blocks':         { strokeColor: '#dc2626', strokeWidth: 2,   animated: true,  label: 'blocks' },
  'is-blocked-by':  { strokeColor: '#dc2626', strokeWidth: 2,   strokeDasharray: '5,3', animated: false, label: 'blocked by' },
  'depends-on':     { strokeColor: '#64748b', strokeWidth: 1.5, strokeDasharray: '4,4', animated: false, label: 'depends on' },
  'relates-to':     { strokeColor: '#cbd5e1', strokeWidth: 1,   animated: false },
  'orphan-link':    { strokeColor: '#f97316', strokeWidth: 1.5, strokeDasharray: '6,3', animated: false },
};

export const ORPHAN_STYLE = {
  border: '2px dashed #f97316',
  bg: '#fff7ed',
  badgeText: 'Orphan Issue',
  badgeColor: '#f97316',
};
