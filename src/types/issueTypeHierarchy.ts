// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Configurable issue-type hierarchy — replaces the previously hardcoded
// IssueNodeType union + TYPE_MAP + LEAF_TYPES allowlist. Admins define which
// raw Jira issue type names exist, what they look like in the Explore graph,
// and where each sits in the hierarchy (level 0 = highest root, e.g. Product;
// increasing levels go deeper, e.g. Project -> Epic -> Story -> Sub-task).

export type IssueTypeSize = 'sm' | 'md' | 'lg';

export interface IssueTypeDefinition {
  id: string;             // stable slug, e.g. 'product'
  label: string;           // display label, e.g. 'Product'
  matchNames: string[];    // raw Jira "Issue Type" names that map here (case-insensitive)
  level: number;           // hierarchy depth — 0 is the topmost root
  icon: string;             // icon registry name (src/lib/icons.ts)
  color: string;
  bg: string;
  border: string;
  size: IssueTypeSize;
  builtIn: boolean;         // shipped default — cannot be deleted, only re-mapped
}

export interface IssueTypeHierarchyConfig {
  types: IssueTypeDefinition[];
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_ISSUE_TYPES: IssueTypeDefinition[] = [
  { id: 'product', label: 'Product', matchNames: ['product'], level: 0, icon: 'package', color: '#0e7490', bg: '#ecfeff', border: '#67e8f9', size: 'lg', builtIn: true },
  { id: 'project', label: 'Project', matchNames: ['project'], level: 1, icon: 'briefcase', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', size: 'lg', builtIn: true },
  { id: 'initiative', label: 'Initiative', matchNames: ['initiative', 'theme', 'portfolio'], level: 1, icon: 'target', color: '#0369a1', bg: '#f0f9ff', border: '#7dd3fc', size: 'lg', builtIn: true },
  { id: 'epic', label: 'Epic', matchNames: ['epic'], level: 2, icon: 'roadmap', color: '#7c3aed', bg: '#faf5ff', border: '#a78bfa', size: 'lg', builtIn: true },
  { id: 'story', label: 'Story', matchNames: ['story', 'user story', 'feature'], level: 3, icon: 'story', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', size: 'md', builtIn: true },
  { id: 'task', label: 'Task', matchNames: ['task', 'improvement'], level: 3, icon: 'checkCircle', color: '#475569', bg: '#f8fafc', border: '#cbd5e1', size: 'md', builtIn: true },
  { id: 'bug', label: 'Bug', matchNames: ['bug', 'defect', 'error'], level: 3, icon: 'bug', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', size: 'md', builtIn: true },
  { id: 'spike', label: 'Spike', matchNames: ['spike'], level: 3, icon: 'flask', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', size: 'md', builtIn: true },
  { id: 'technical-debt', label: 'Technical Debt', matchNames: ['technical debt'], level: 3, icon: 'warning', color: '#ea580c', bg: '#fff7ed', border: '#fdba74', size: 'md', builtIn: true },
  { id: 'risk', label: 'Risk', matchNames: ['risk'], level: 3, icon: 'alert', color: '#9f1239', bg: '#fff1f2', border: '#fda4af', size: 'md', builtIn: true },
  { id: 'change-request', label: 'Change Request', matchNames: ['change request'], level: 3, icon: 'refresh', color: '#0f766e', bg: '#f0fdfa', border: '#5eead4', size: 'md', builtIn: true },
  { id: 'sub-task', label: 'Sub-task', matchNames: ['sub-task', 'subtask'], level: 4, icon: 'subtasks', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', size: 'sm', builtIn: true },
];

export const DEFAULT_ISSUE_TYPE_HIERARCHY: IssueTypeHierarchyConfig = {
  types: DEFAULT_ISSUE_TYPES,
  updatedAt: '',
  updatedBy: 'system',
};

// Fallback visual treatment for a raw type name that matches no configured
// definition. Never persisted, never user-editable — always available so the
// Explore graph degrades safely instead of crashing on an unrecognized type.
export const UNKNOWN_ISSUE_TYPE: Omit<IssueTypeDefinition, 'id' | 'label' | 'matchNames' | 'level' | 'builtIn'> = {
  icon: 'question', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', size: 'sm',
};

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function buildIssueTypeId(label: string, existingIds: string[]): string {
  const base = slugify(label) || 'type';
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
