// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type SectionMode = 'full' | 'overview' | string;

export interface SwitcherSection {
  key:       string;
  label:     string;
  icon:      string;
  sectionId: string;
}

export const DASHBOARD_SECTIONS: SwitcherSection[] = [
  { key: 'overview',        label: 'Key Metrics',   icon: '📊', sectionId: 'section-overview' },
  { key: 'attention',       label: 'Risks',          icon: '🚨', sectionId: 'section-attention' },
  { key: 'recommendations', label: 'Actions',        icon: '⚡', sectionId: 'section-recommendations' },
  { key: 'ratios',          label: 'Delivery Mix',   icon: '🍩', sectionId: 'section-ratios' },
  { key: 'visuals',         label: 'Analytics',      icon: '📈', sectionId: 'section-visuals' },
  { key: 'delivery',        label: 'Delivery',       icon: '🌊', sectionId: 'section-delivery-controls' },
  { key: 'quarters',        label: 'Trends',         icon: '📅', sectionId: 'section-quarters' },
  { key: 'kanban',          label: 'Kanban',         icon: '🗃️', sectionId: 'section-kanban' },
  { key: 'sprint',          label: 'Sprints',        icon: '🏃', sectionId: 'section-sprint' },
  { key: 'ownership',       label: 'Capacity',       icon: '👥', sectionId: 'section-ownership' },
  { key: 'labels',          label: 'Labels',         icon: '🏷️', sectionId: 'section-labels' },
  { key: 'relations',       label: 'Work Items',     icon: '🔗', sectionId: 'section-relations' },
  { key: 'readiness',       label: 'Readiness',      icon: '🚀', sectionId: 'section-readiness' },
  { key: 'throughput',      label: 'Throughput',     icon: '⚡', sectionId: 'section-throughput' },
];

export const OVERVIEW_KEYS = new Set(['overview', 'attention', 'recommendations']);
