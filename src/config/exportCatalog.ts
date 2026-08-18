// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

export type ExportFormat = 'xlsx' | 'pdf';

export interface ExportSection {
  id: string;
  label: string;
  description: string;
}

export interface ExportDefinition {
  format: ExportFormat;
  label: string;
  audience: string;
  purpose: string;
  sections: readonly ExportSection[];
}

export const EXPORT_CATALOG: Record<ExportFormat, ExportDefinition> = {
  xlsx: {
    format: 'xlsx',
    label: 'Excel workbook',
    audience: 'Delivery practitioners and analysts',
    purpose: 'Explore the underlying data, calculations, risks, and delivery signals.',
    sections: [
      { id: 'summary', label: 'Executive Summary', description: 'Health score and headline KPIs.' },
      { id: 'flow', label: 'Flow Metrics', description: 'Throughput, lead time, cycle time, WIP, and flow health.' },
      { id: 'delivery', label: 'Sprint & Delivery', description: 'Velocity, predictability, completion, and sprint health.' },
      { id: 'forecast', label: 'Forecast', description: 'Delivery outlook and confidence.' },
      { id: 'risks', label: 'Risks & Attention', description: 'Blocked, stale, critical, and warning work items.' },
      { id: 'issues', label: 'Work Items', description: 'Detailed underlying Jira work-item records.' },
      { id: 'quality', label: 'Data Quality', description: 'Missing-field and confidence information.' },
    ],
  },
  pdf: {
    format: 'pdf',
    label: 'Executive PDF',
    audience: 'Stakeholders, directors, and executives',
    purpose: 'Communicate the delivery story in a concise, presentation-ready report.',
    sections: [
      { id: 'identity', label: 'Report Context', description: 'Team/project and reporting-period context.' },
      { id: 'health', label: 'Delivery Health', description: 'Overall delivery-health score and headline KPIs.' },
      { id: 'trend', label: 'Delivery Trend', description: 'Direction of travel and recent delivery signal.' },
      { id: 'flow', label: 'Flow', description: 'Throughput and cycle/lead-time summary.' },
      { id: 'predictability', label: 'Predictability', description: 'Sprint/delivery predictability summary.' },
      { id: 'forecast', label: 'Forecast', description: 'Expected delivery outlook.' },
      { id: 'risks', label: 'Risks', description: 'The most important blockers and delivery risks.' },
      { id: 'actions', label: 'Recommended Actions', description: 'Coaching and management actions.' },
    ],
  },
} as const;

export function getExportDefinition(format: ExportFormat): ExportDefinition {
  return EXPORT_CATALOG[format];
}
