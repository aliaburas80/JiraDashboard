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
  hidden:           string[];   // section keys to hide completely (CollapsibleTrigger + content + TierSep tier)
  hideTiers:        string[];   // which TierSep tier labels to hide ('attention'|'primary'|'delivery'|'deepdive')
  hideFlowPanel:    boolean;    // hide the Flow Health Panel (it has its own toggle outside the CollapsibleTrigger system)
  accentColor:      string;
}

export const DASHBOARD_VIEWS: DashboardView[] = [
  {
    id:            'full',
    label:         'Full Report',
    icon:          '📋',
    audience:      'Everyone',
    description:   'All sections visible. Expand or collapse any section individually.',
    defaultOpen:   ['overview', 'attention', 'readiness'],
    hidden:        [],
    hideTiers:     [],
    hideFlowPanel: false,
    accentColor:   '#2563eb',
  },
  {
    id:            'executive',
    label:         'Executive',
    icon:          '👔',
    audience:      'Directors & C-level',
    description:   'Health score, key metrics, top risks, and recommendations — no technical detail.',
    defaultOpen:   ['overview', 'recommendations', 'attention'],
    hidden:        ['throughput', 'visuals', 'labels', 'relations',
                   'delivery', 'quarters', 'kanban', 'sprint', 'ownership'],
    hideTiers:     ['delivery', 'deepdive'],
    hideFlowPanel: true,
    accentColor:   '#7c3aed',
  },
  {
    id:            'scrum_master',
    label:         'Scrum Master',
    icon:          '🏃',
    audience:      'Scrum Masters',
    description:   'Sprint health, mid-sprint delivery patterns, blockers, and flow metrics.',
    defaultOpen:   ['throughput', 'attention', 'delivery'],
    hidden:        ['labels', 'relations', 'quarters', 'ratios', 'visuals'],
    hideTiers:     ['deepdive'],
    hideFlowPanel: false,
    accentColor:   '#0891b2',
  },
  {
    id:            'product_owner',
    label:         'Product Owner',
    icon:          '📖',
    audience:      'Product Owners',
    description:   'Epic readiness, release confidence, orphan items, and delivery completion.',
    defaultOpen:   ['readiness', 'attention', 'ratios', 'overview'],
    hidden:        ['throughput', 'delivery', 'quarters', 'kanban', 'sprint', 'ownership'],
    hideTiers:     ['delivery'],
    hideFlowPanel: true,
    accentColor:   '#16a34a',
  },
  {
    id:            'engineering_manager',
    label:         'Eng Manager',
    icon:          '⚙️',
    audience:      'Engineering Managers',
    description:   'Team capacity, velocity trends, lead & cycle time, and quality metrics.',
    defaultOpen:   ['overview', 'ownership', 'throughput'],
    hidden:        ['relations', 'labels', 'quarters', 'ratios', 'visuals'],
    hideTiers:     ['deepdive'],
    hideFlowPanel: false,
    accentColor:   '#d97706',
  },
];

export const DEFAULT_VIEW_ID: ViewId = 'full';
