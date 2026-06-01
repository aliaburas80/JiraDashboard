// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type ViewId =
  | 'full'
  | 'executive'
  | 'scrum_master'
  | 'product_owner'
  | 'engineering_manager';

export interface DashboardView {
  id:               ViewId;
  label:            string;
  icon:             string;
  audience:         string;
  description:      string;
  defaultOpen:      string[];   // section keys to auto-expand
  hidden:           string[];   // section keys to hide completely
  accentColor:      string;
}

export const DASHBOARD_VIEWS: DashboardView[] = [
  {
    id:          'full',
    label:       'Full Report',
    icon:        '📋',
    audience:    'Everyone',
    description: 'All sections visible. Expand or collapse any section individually.',
    defaultOpen: ['overview', 'attention', 'readiness'],
    hidden:      [],
    accentColor: '#2563eb',
  },
  {
    id:          'executive',
    label:       'Executive',
    icon:        '👔',
    audience:    'Directors & C-level',
    description: 'High-level health, completion, top risks, and key recommendations — no technical detail.',
    defaultOpen: ['overview', 'recommendations', 'ratios'],
    hidden:      ['throughput', 'visuals', 'labels', 'relations', 'delivery', 'quarters', 'kanban', 'sprint', 'ownership'],
    accentColor: '#7c3aed',
  },
  {
    id:          'scrum_master',
    label:       'Scrum Master',
    icon:        '🏃',
    audience:    'Scrum Masters',
    description: 'Sprint health, mid-sprint delivery patterns, blockers, and flow metrics.',
    defaultOpen: ['throughput', 'attention', 'delivery'],
    hidden:      ['labels', 'relations', 'quarters', 'ratios'],
    accentColor: '#0891b2',
  },
  {
    id:          'product_owner',
    label:       'Product Owner',
    icon:        '📖',
    audience:    'Product Owners',
    description: 'Epic readiness, release confidence, orphan risks, and completion by area.',
    defaultOpen: ['readiness', 'attention', 'ratios', 'overview'],
    hidden:      ['throughput', 'labels', 'delivery', 'quarters', 'kanban', 'sprint', 'ownership'],
    accentColor: '#16a34a',
  },
  {
    id:          'engineering_manager',
    label:       'Eng Manager',
    icon:        '⚙️',
    audience:    'Engineering Managers',
    description: 'Team capacity, velocity trends, lead & cycle time, and defect tracking.',
    defaultOpen: ['overview', 'ownership', 'throughput'],
    hidden:      ['relations', 'labels', 'quarters', 'ratios'],
    accentColor: '#d97706',
  },
];

export const DEFAULT_VIEW_ID: ViewId = 'full';
