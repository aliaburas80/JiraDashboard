// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import type { DashboardMetrics, FlowItem } from '@/types/metrics';

export interface SharedRiskItem {
  key: string;
  summary: string;
  status: string;
  assignee?: string;
  reason?: string;
}

export interface SharedReportPayload {
  version: 1;
  title: string;
  generatedAt: string;
  healthScore: number;
  totalIssues: number;
  doneIssues: number;
  completionRate: number;
  blockedIssues: number;
  openDefects: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  risks: SharedRiskItem[];
}

function finite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function buildSharedReportPayload(
  metrics: DashboardMetrics,
  title = 'Delivery Clarity Stakeholder Report',
  generatedAt = new Date(),
): SharedReportPayload {
  const items = ((metrics.flow?.items ?? []) as FlowItem[])
    .filter(item => item.health === 'critical' || item.health === 'warning' || Boolean(item.reason))
    .slice(0, 25)
    .map(item => ({
      key: String(item.key ?? ''),
      summary: String(item.summary ?? ''),
      status: String(item.status ?? ''),
      assignee: item.assignee ? String(item.assignee) : undefined,
      reason: item.reason ? String(item.reason) : undefined,
    }));

  return {
    version: 1,
    title: title.trim().slice(0, 120) || 'Delivery Clarity Stakeholder Report',
    generatedAt: generatedAt.toISOString(),
    healthScore: finite(metrics.healthScore),
    totalIssues: finite(metrics.totalIssues),
    doneIssues: finite(metrics.doneIssues),
    completionRate: finite(metrics.completionRate),
    blockedIssues: finite(metrics.blockedIssues),
    openDefects: finite(metrics.openDefects),
    averageLeadTimeDays: finite(metrics.flow?.averageLeadTimeDays),
    averageCycleTimeDays: finite(metrics.flow?.averageCycleTimeDays),
    risks: items,
  };
}
