// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

export type SectionMode = 'full' | 'overview' | string;

export interface SwitcherSection {
  key:       string;
  label:     string;
  icon:      string;
  sectionId: string;
}

export const DASHBOARD_SECTIONS: SwitcherSection[] = [
  { key: 'overview',        label: 'Key Metrics',   icon: 'chartBar', sectionId: 'section-overview' },
  { key: 'attention',       label: 'Risks',          icon: 'warning', sectionId: 'section-attention' },
  { key: 'recommendations', label: 'Actions',        icon: 'priorityHigh', sectionId: 'section-recommendations' },
  { key: 'ratios',          label: 'Delivery Mix',   icon: 'chartPie', sectionId: 'section-ratios' },
  { key: 'visuals',         label: 'Analytics',      icon: 'chartTrendUp', sectionId: 'section-visuals' },
  { key: 'delivery',        label: 'Delivery',       icon: 'dataFlow', sectionId: 'section-delivery-controls' },
  { key: 'quarters',        label: 'Trends',         icon: 'calendar', sectionId: 'section-quarters' },
  { key: 'kanban',          label: 'Kanban',         icon: 'board', sectionId: 'section-kanban' },
  { key: 'sprint',          label: 'Sprints',        icon: 'sprint', sectionId: 'section-sprint' },
  { key: 'ownership',       label: 'Capacity',       icon: 'people', sectionId: 'section-ownership' },
  { key: 'labels',          label: 'Labels',         icon: 'tag', sectionId: 'section-labels' },
  { key: 'relations',       label: 'Work Items',     icon: 'workItems', sectionId: 'section-relations' },
  { key: 'readiness',       label: 'Readiness',      icon: 'checkCircle', sectionId: 'section-readiness' },
  { key: 'throughput',      label: 'Throughput',     icon: 'timeline', sectionId: 'section-throughput' },
];

export const OVERVIEW_KEYS = new Set(['overview', 'attention', 'recommendations']);
