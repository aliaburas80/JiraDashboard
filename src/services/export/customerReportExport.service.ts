// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Customer Delivery Report (/customer) CSV export — MPE-01.
// The page already offers "Print / Save PDF" for the polished stakeholder
// document; this adds a machine-readable CSV alongside it, covering the
// same sections shown on screen: key metrics, status breakdown, delivery
// areas (epics), and current risks.

import { buildSectionedCsv, type CsvExportSection } from '@/lib/exportSafety';

export interface CustomerReportKpi {
  label: string;
  val: string | number;
  sub: string;
}

export interface CustomerReportStatusSegment {
  label: string;
  count: number;
  pct: number;
}

export interface CustomerReportEpic {
  epic: string;
  healthLabel: string;
  progress: number;
  completedIssues: number;
  issues: number;
  critical: number;
}

export interface CustomerReportRisk {
  level: string;
  text: string;
}

export interface CustomerReportExportData {
  kpis: CustomerReportKpi[];
  statusDistribution: CustomerReportStatusSegment[];
  epics: CustomerReportEpic[];
  risks: CustomerReportRisk[];
}

export function buildCustomerReportCsv(data: CustomerReportExportData): string {
  const sections: CsvExportSection[] = [
    {
      title: 'Key Metrics',
      header: ['Metric', 'Value', 'Detail'],
      rows: data.kpis.map(k => [k.label, k.val, k.sub]),
    },
    {
      title: 'Work Status Breakdown',
      header: ['Status', 'Count', '% of Total'],
      rows: data.statusDistribution.map(d => [d.label, d.count, d.pct]),
    },
    {
      title: 'Delivery Areas',
      header: ['Epic', 'Status', 'Progress %', 'Completed', 'Total Issues', 'Critical'],
      rows: data.epics.map(e => [e.epic, e.healthLabel, e.progress, e.completedIssues, e.issues, e.critical]),
    },
    {
      title: 'Current Risks',
      header: ['Priority', 'Risk'],
      rows: data.risks.length ? data.risks.map(r => [r.level, r.text]) : [['—', 'No significant delivery risks identified at this time.']],
    },
  ];
  return buildSectionedCsv(sections);
}

export function exportCustomerReportToCsv(data: CustomerReportExportData): void {
  const csv = buildCustomerReportCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `delivery-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
