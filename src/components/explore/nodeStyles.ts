// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
import type { IssueNodeType, NodeTypeConfig, RelationEdgeType, EdgeConfig } from '@/types/relations';

export const NODE_TYPE_CONFIG: Record<IssueNodeType, NodeTypeConfig> = {
  Epic:             { color: '#7c3aed', bg: '#faf5ff', border: '#a78bfa', icon: 'roadmap', size: 'lg' },
  Story:            { color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', icon: 'story', size: 'md' },
  Task:             { color: '#475569', bg: '#f8fafc', border: '#cbd5e1', icon: 'checkCircle', size: 'md' },
  'Sub-task':       { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: 'subtasks',  size: 'sm' },
  Bug:              { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: 'bug', size: 'md' },
  Spike:            { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: 'flask', size: 'md' },
  'Technical Debt': { color: '#ea580c', bg: '#fff7ed', border: '#fdba74', icon: 'warning', size: 'md' },
  Risk:             { color: '#9f1239', bg: '#fff1f2', border: '#fda4af', icon: 'alert', size: 'md' },
  'Change Request': { color: '#0f766e', bg: '#f0fdfa', border: '#5eead4', icon: 'refresh', size: 'md' },
  Unknown:          { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', icon: 'question', size: 'sm' },
};

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
